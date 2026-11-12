import { ensureSchema, sql } from "@/lib/db";
import { getDog } from "@/lib/dogs";
import { getService } from "@/lib/services";
import type { Appointment, AppointmentStatus, CibaStatus } from "@/lib/types";

type AppointmentRow = {
  id: string;
  user_sub: string;
  dog_id: string;
  service_id: string;
  visit_date: string;
  visit_time: string;
  notes: string | null;
  status: AppointmentStatus;
  calendar_event_id: string | null;
  calendar_event_link: string | null;
  cancel_ciba_auth_req_id: string | null;
  cancel_ciba_status: CibaStatus | null;
  cancel_ciba_interval_sec: number | null;
  cancel_ciba_last_polled_at: string | null;
  cancel_ciba_expires_at: string | null;
  created_at: string;
  dog_name?: string;
  dog_breed?: string;
};

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    userSub: row.user_sub,
    dogId: row.dog_id,
    serviceId: row.service_id,
    visitDate: String(row.visit_date).slice(0, 10),
    visitTime: row.visit_time,
    notes: row.notes,
    status: row.status,
    calendarEventId: row.calendar_event_id,
    calendarEventLink: row.calendar_event_link,
    cancelCibaAuthReqId: row.cancel_ciba_auth_req_id,
    cancelCibaStatus: row.cancel_ciba_status,
    cancelCibaIntervalSec: row.cancel_ciba_interval_sec,
    cancelCibaLastPolledAt: row.cancel_ciba_last_polled_at,
    cancelCibaExpiresAt: row.cancel_ciba_expires_at,
    createdAt: row.created_at,
    dogName: row.dog_name,
    dogBreed: row.dog_breed,
  };
}

export async function listAppointments(userSub: string): Promise<Appointment[]> {
  await ensureSchema();
  const rows = await sql`
    select
      a.id, a.user_sub, a.dog_id, a.service_id,
      a.visit_date::text, a.visit_time, a.notes, a.status,
      a.calendar_event_id, a.calendar_event_link,
      a.cancel_ciba_auth_req_id, a.cancel_ciba_status,
      a.cancel_ciba_interval_sec,
      a.cancel_ciba_last_polled_at::text,
      a.cancel_ciba_expires_at::text,
      a.created_at::text,
      d.name as dog_name, d.breed as dog_breed
    from appointments a
    join dogs d on d.id = a.dog_id
    where a.user_sub = ${userSub}
      and a.status <> 'cancelled'
    order by a.visit_date asc, a.visit_time asc
  `;
  return (rows as AppointmentRow[]).map(mapAppointment);
}

export async function getAppointment(
  userSub: string,
  appointmentId: string,
): Promise<Appointment | null> {
  await ensureSchema();
  const rows = await sql`
    select
      a.id, a.user_sub, a.dog_id, a.service_id,
      a.visit_date::text, a.visit_time, a.notes, a.status,
      a.calendar_event_id, a.calendar_event_link,
      a.cancel_ciba_auth_req_id, a.cancel_ciba_status,
      a.cancel_ciba_interval_sec,
      a.cancel_ciba_last_polled_at::text,
      a.cancel_ciba_expires_at::text,
      a.created_at::text,
      d.name as dog_name, d.breed as dog_breed
    from appointments a
    join dogs d on d.id = a.dog_id
    where a.user_sub = ${userSub} and a.id = ${appointmentId}
  `;
  return rows[0] ? mapAppointment(rows[0] as AppointmentRow) : null;
}

export async function bookAppointment(
  userSub: string,
  input: {
    dogId: string;
    serviceId: string;
    visitDate: string;
    visitTime: string;
    notes?: string;
  },
): Promise<Appointment> {
  const service = getService(input.serviceId);
  if (!service) throw new Error("Unknown grooming service.");

  const dog = await getDog(userSub, input.dogId);
  if (!dog) throw new Error("That dog is not on your roster.");

  await ensureSchema();
  const rows = await sql`
    insert into appointments (user_sub, dog_id, service_id, visit_date, visit_time, notes)
    values (
      ${userSub},
      ${input.dogId},
      ${input.serviceId},
      ${input.visitDate},
      ${input.visitTime},
      ${input.notes?.trim() || null}
    )
    returning
      id, user_sub, dog_id, service_id,
      visit_date::text, visit_time, notes, status,
      calendar_event_id, calendar_event_link,
      cancel_ciba_auth_req_id, cancel_ciba_status,
      cancel_ciba_interval_sec,
      cancel_ciba_last_polled_at::text,
      cancel_ciba_expires_at::text,
      created_at::text
  `;
  const created = mapAppointment(rows[0] as AppointmentRow);
  created.dogName = dog.name;
  created.dogBreed = dog.breed;
  return created;
}

export async function saveCalendarEvent(
  userSub: string,
  appointmentId: string,
  event: { id: string; htmlLink: string },
): Promise<void> {
  await ensureSchema();
  await sql`
    update appointments
    set calendar_event_id = ${event.id}, calendar_event_link = ${event.htmlLink}
    where user_sub = ${userSub} and id = ${appointmentId}
  `;
}

export async function setCancelCibaPending(
  userSub: string,
  appointmentId: string,
): Promise<void> {
  await ensureSchema();
  await sql`
    update appointments
    set status = 'cancel_pending', cancel_ciba_status = 'pending'
    where user_sub = ${userSub} and id = ${appointmentId}
  `;
}

export async function saveCancelCibaGrant(
  appointmentId: string,
  grant: { authReqId: string; intervalSec: number; expiresAt: Date },
): Promise<void> {
  await ensureSchema();
  await sql`
    update appointments
    set
      cancel_ciba_auth_req_id = ${grant.authReqId},
      cancel_ciba_status = 'pending',
      cancel_ciba_interval_sec = ${grant.intervalSec},
      cancel_ciba_expires_at = ${grant.expiresAt.toISOString()},
      cancel_ciba_last_polled_at = null
    where id = ${appointmentId}
  `;
}

export async function claimCancelCibaPollSlot(appointmentId: string): Promise<{
  authReqId: string;
  intervalSec: number;
} | null> {
  await ensureSchema();
  const rows = await sql`
    select
      cancel_ciba_auth_req_id as auth_req_id,
      cancel_ciba_interval_sec as interval_sec,
      cancel_ciba_last_polled_at as last_polled_at,
      cancel_ciba_status as status
    from appointments
    where id = ${appointmentId}
  `;
  const row = rows[0] as
    | {
        auth_req_id: string | null;
        interval_sec: number | null;
        last_polled_at: string | null;
        status: string | null;
      }
    | undefined;
  if (!row?.auth_req_id || row.status !== "pending") return null;

  const intervalSec = Math.max(5, Number(row.interval_sec ?? 5));
  if (row.last_polled_at) {
    const last = new Date(row.last_polled_at).getTime();
    if (Date.now() < last + intervalSec * 1000) return null;
  }

  await sql`
    update appointments
    set cancel_ciba_last_polled_at = now()
    where id = ${appointmentId} and cancel_ciba_status = 'pending'
  `;
  return { authReqId: row.auth_req_id, intervalSec };
}

export async function updateCancelCibaInterval(
  appointmentId: string,
  intervalSec: number,
): Promise<void> {
  await ensureSchema();
  await sql`
    update appointments
    set cancel_ciba_interval_sec = ${intervalSec}
    where id = ${appointmentId}
  `;
}

export async function completeCancelCiba(
  appointmentId: string,
  status: "approved" | "denied",
): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`
    update appointments
    set cancel_ciba_status = ${status}
    where id = ${appointmentId} and cancel_ciba_status = 'pending'
    returning id
  `;
  return rows.length > 0;
}

/**
 * The appointment is only removed after CIBA approval — never before.
 */
export async function deleteAppointmentAfterCiba(
  appointmentId: string,
): Promise<void> {
  await ensureSchema();
  await sql`delete from appointments where id = ${appointmentId}`;
}

export async function revertCancelPending(appointmentId: string): Promise<void> {
  await ensureSchema();
  await sql`
    update appointments
    set
      status = 'booked',
      cancel_ciba_auth_req_id = null,
      cancel_ciba_status = 'denied',
      cancel_ciba_interval_sec = null,
      cancel_ciba_last_polled_at = null,
      cancel_ciba_expires_at = null
    where id = ${appointmentId}
  `;
}

export async function listPendingCancels(
  userSub: string,
): Promise<Appointment[]> {
  await ensureSchema();
  const rows = await sql`
    select
      a.id, a.user_sub, a.dog_id, a.service_id,
      a.visit_date::text, a.visit_time, a.notes, a.status,
      a.calendar_event_id, a.calendar_event_link,
      a.cancel_ciba_auth_req_id, a.cancel_ciba_status,
      a.cancel_ciba_interval_sec,
      a.cancel_ciba_last_polled_at::text,
      a.cancel_ciba_expires_at::text,
      a.created_at::text,
      d.name as dog_name, d.breed as dog_breed
    from appointments a
    join dogs d on d.id = a.dog_id
    where a.user_sub = ${userSub} and a.status = 'cancel_pending'
  `;
  return (rows as AppointmentRow[]).map(mapAppointment);
}
