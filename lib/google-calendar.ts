import { AccessTokenForConnectionError } from "@auth0/nextjs-auth0/errors";
import { SALON_TZ, addMinutesCivil, pacificDateTime } from "@/lib/pacific";
import { getService } from "@/lib/services";
import type { Appointment } from "@/lib/types";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export type CalendarEvent = {
  id: string;
  htmlLink: string;
  summary?: string;
};

export const TOKEN_VAULT_TIP =
  "Auth0 Token Vault holds the Google refresh token. This app never stores it. Login does not request Calendar scopes — connect Google Calendar when the assistant pauses.";

export class CalendarNotConnectedError extends Error {
  constructor(message = "Google Calendar is not connected yet.") {
    super(message);
    this.name = "CalendarNotConnectedError";
  }
}

export function explainCalendarError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    error instanceof AccessTokenForConnectionError ||
    lower.includes("access token") ||
    lower.includes("not connected") ||
    lower.includes("refresh token") ||
    lower.includes("consent")
  ) {
    return `${message} ${TOKEN_VAULT_TIP}`;
  }
  return message;
}

function appointmentDateTimes(appointment: Appointment) {
  const service = getService(appointment.serviceId);
  const durationMin = service?.durationMin ?? 45;
  const end = addMinutesCivil(appointment.visitDate, appointment.visitTime, durationMin);

  return {
    start: pacificDateTime(appointment.visitDate, appointment.visitTime),
    end: pacificDateTime(end.date, end.time),
    timeZone: SALON_TZ,
    service,
  };
}

export async function createAppointmentReminder(
  accessToken: string,
  appointment: Appointment,
): Promise<CalendarEvent> {
  const { start, end, timeZone, service } = appointmentDateTimes(appointment);
  const dogName = appointment.dogName ?? "your dog";
  const summary = service
    ? `${service.name} for ${dogName}`
    : `Grooming for ${dogName}`;

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary,
      description: [
        "Anna's Dog Grooming appointment",
        "Times are Pacific (America/Los_Angeles).",
        service ? `${service.name} · $${service.price} · ${service.durationMin}m` : appointment.serviceId,
        appointment.notes ? `Notes: ${appointment.notes}` : null,
        "Written via Auth0 Token Vault — this app never stored your Google refresh token.",
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google Calendar API error ${res.status}: ${detail}`);
  }

  return (await res.json()) as CalendarEvent;
}
