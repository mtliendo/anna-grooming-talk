import { bookAppointmentAction, cancelAppointmentAction } from "@/app/actions";
import type { Appointment, Dog } from "@/lib/types";
import {
  GROOMING_SERVICES,
  TIME_SLOTS,
  formatServiceLine,
  getService,
} from "@/lib/services";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AppointmentPanel({
  dogs,
  appointments,
}: {
  dogs: Dog[];
  appointments: Appointment[];
}) {
  return (
    <section className="card card-pad">
      <p className="eyebrow">Appointments</p>
      <h2 className="card-title">Hold a table</h2>
      <p className="muted">
        Cancel sends an email confirmation. The visit stays on the book until
        you accept — we never drop it from a chat yes.
      </p>

      <form action={bookAppointmentAction} className="stack" style={{ marginTop: 18 }}>
        <label className="field">
          <span>Dog</span>
          <select name="dogId" required disabled={dogs.length === 0} defaultValue="">
            <option value="" disabled>
              {dogs.length ? "Choose a dog" : "Register a dog first"}
            </option>
            {dogs.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.name} · {dog.breed}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Service</span>
          <select name="serviceId" required defaultValue={GROOMING_SERVICES[0].id}>
            {GROOMING_SERVICES.map((service) => (
              <option key={service.id} value={service.id}>
                {formatServiceLine(service)}
              </option>
            ))}
          </select>
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Date</span>
            <input type="date" name="date" required min={todayIso()} />
          </label>
          <label className="field">
            <span>Time slot</span>
            <select name="time" required defaultValue={TIME_SLOTS[0]}>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Notes</span>
          <input name="notes" placeholder="Please text when you arrive" />
        </label>
        <button className="btn btn-primary" type="submit" disabled={dogs.length === 0}>
          Book appointment
        </button>
      </form>

      <div className="stack" style={{ marginTop: 22 }}>
        {appointments.length === 0 ? (
          <div className="empty">No visits on the books yet.</div>
        ) : (
          appointments.map((appointment) => {
            const service = getService(appointment.serviceId);
            const pending = appointment.status === "cancel_pending";
            return (
              <article key={appointment.id} className="appt-card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>
                    {appointment.dogName} · {service?.name ?? appointment.serviceId}
                  </strong>
                  {pending ? (
                    <span className="badge badge-terracotta">Waiting for email</span>
                  ) : (
                    <form action={cancelAppointmentAction}>
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <button className="btn btn-danger btn-small" type="submit">
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
                <div className="muted">
                  {appointment.visitDate} at {appointment.visitTime}
                  {service ? ` · ${formatServiceLine(service)}` : null}
                </div>
                {appointment.notes ? <p className="faint" style={{ margin: 0 }}>{appointment.notes}</p> : null}
                {appointment.calendarEventLink ? (
                  <a
                    className="badge badge-sage"
                    href={appointment.calendarEventLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    On Google Calendar
                  </a>
                ) : null}
                {pending ? (
                  <p className="faint" style={{ margin: 0 }}>
                    We emailed you to confirm. This visit stays until you accept.
                  </p>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
