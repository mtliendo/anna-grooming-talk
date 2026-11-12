import { bindingMessageForCancel } from "@/lib/binding-message";
import {
  CIBA_CANCEL_EXPIRY_SECONDS,
  pollCiba,
  startCiba,
} from "@/lib/ciba";
import { CIBA_INTERVAL_FLOOR, floorInterval, nextPollInterval } from "@/lib/ciba-interval";
import {
  claimCancelCibaPollSlot,
  completeCancelCiba,
  deleteAppointmentAfterCiba,
  getAppointment,
  listAppointments,
  revertCancelPending,
  saveCancelCibaGrant,
  setCancelCibaPending,
  updateCancelCibaInterval,
} from "@/lib/appointments";
import type { Appointment } from "@/lib/types";

function namedMatches(appointmentId: string, named: string | undefined): boolean {
  if (!named?.trim()) return true;
  const needle = named.replace(/[^a-f0-9-]/gi, "").toLowerCase();
  if (!needle) return true;
  const id = appointmentId.toLowerCase();
  const compact = id.replace(/-/g, "");
  const compactNeedle = needle.replace(/-/g, "");
  return (
    id.includes(needle) ||
    compact.startsWith(compactNeedle) ||
    compact.includes(compactNeedle)
  );
}

/**
 * CIBA-gated cancel. Emails the signed-in user (login_hint iss_sub).
 * The appointment is NOT deleted until Auth0 reports approval.
 */
export async function requestCancelAppointment(
  appointment: Appointment,
  actorSub: string,
  namedId?: string,
): Promise<{
  ok: boolean;
  pending: boolean;
  bindingMessage?: string;
  message: string;
}> {
  if (!actorSub) {
    return {
      ok: false,
      pending: false,
      message:
        "No signed-in Auth0 sub on this session. CIBA was not sent. The appointment was not cancelled.",
    };
  }

  if (namedId && !namedMatches(appointment.id, namedId)) {
    return {
      ok: false,
      pending: false,
      message: `That id does not match this appointment (${appointment.id}). Nothing was cancelled.`,
    };
  }

  const latest =
    (await getAppointment(appointment.userSub, appointment.id)) ?? appointment;
  if (latest.status === "cancelled") {
    return {
      ok: true,
      pending: false,
      message: "This appointment is already gone.",
    };
  }

  if (latest.cancelCibaStatus === "pending" || latest.status === "cancel_pending") {
    return {
      ok: true,
      pending: true,
      bindingMessage: bindingMessageForCancel(latest.id),
      message:
        "A confirmation email is already pending. Check the inbox for the authorizing user and Accept. The appointment is still on the book until then.",
    };
  }

  const bindingMessage = bindingMessageForCancel(latest.id);
  await setCancelCibaPending(latest.userSub, latest.id);

  let started: Awaited<ReturnType<typeof startCiba>>;
  try {
    started = await startCiba(actorSub, bindingMessage, {
      requestedExpirySeconds: CIBA_CANCEL_EXPIRY_SECONDS,
    });
  } catch (error) {
    await revertCancelPending(latest.id);
    const message = error instanceof Error ? error.message : "bc-authorize failed";
    return {
      ok: false,
      pending: false,
      message: [
        `Could not start CIBA (${message}). The appointment was NOT cancelled.`,
        "The authorizing user needs a verified email, and the Auth0 app needs the CIBA grant plus the email channel (requested_expiry=301).",
      ].join(" "),
    };
  }

  await saveCancelCibaGrant(latest.id, {
    authReqId: started.authReqId,
    intervalSec: floorInterval(started.interval ?? CIBA_INTERVAL_FLOOR),
    expiresAt: new Date(Date.now() + started.expiresIn * 1000),
  });

  return {
    ok: true,
    pending: true,
    bindingMessage,
    message: [
      `Confirmation email sent (binding message ${bindingMessage}).`,
      "The appointment stays on the book until the authorizing user Accepts in that email.",
      "Do not say it is cancelled yet.",
    ].join(" "),
  };
}

export async function pollCancelCibaForAppointment(
  userSub: string,
  appointmentId: string,
): Promise<Appointment | null> {
  const slot = await claimCancelCibaPollSlot(appointmentId);
  if (!slot) {
    return getAppointment(userSub, appointmentId);
  }

  const result = await pollCiba(slot.authReqId);

  if (result.status === "pending") {
    await updateCancelCibaInterval(
      appointmentId,
      nextPollInterval(slot.intervalSec, result.interval, result.slowDown),
    );
    return getAppointment(userSub, appointmentId);
  }

  if (result.status === "approved") {
    const won = await completeCancelCiba(appointmentId, "approved");
    if (won) {
      await deleteAppointmentAfterCiba(appointmentId);
    }
    return null;
  }

  const won = await completeCancelCiba(appointmentId, "denied");
  if (won) {
    await revertCancelPending(appointmentId);
  }
  return getAppointment(userSub, appointmentId);
}

export async function pollAllPendingCancels(
  userSub: string,
  appointments: Appointment[],
): Promise<Appointment[]> {
  const pending = appointments.filter(
    (a) => a.status === "cancel_pending" || a.cancelCibaStatus === "pending",
  );
  for (const appt of pending) {
    await pollCancelCibaForAppointment(userSub, appt.id);
  }
  return listAppointments(userSub);
}
