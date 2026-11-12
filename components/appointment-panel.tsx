import { bookAppointmentAction, cancelAppointmentAction } from "@/app/actions";
import type { Appointment, Dog } from "@/lib/types";
import {
  formatSlotLabel,
  formatVisitWhen,
  todayIsoPacific,
} from "@/lib/pacific";
import {
  GROOMING_SERVICES,
  TIME_SLOTS,
  formatDuration,
  formatPrice,
  getService,
} from "@/lib/services";

export function AppointmentPanel({
  dogs,
  appointments,
}: {
  dogs: Dog[];
  appointments: Appointment[];
}) {
  const minDate = todayIsoPacific();

  return (
    <section className="card card-pad">
      <p className="eyebrow">Request a table</p>
      <h2 className="card-title">Hold a visit</h2>
      <p className="muted">
        The paper-style book. Fill every field so we can hold the chair —
        missing details send you back to the form. Hours and slots are{" "}
        <strong>Pacific time (California)</strong>. If you cancel, we email you
        first; the visit stays until you accept.
      </p>

      <form action={bookAppointmentAction} className="stack book-form" style={{ marginTop: 18 }}>
        <label className="field">
          <span>Which dog is this visit for?</span>
          <select name="dogId" required disabled={dogs.length === 0} defaultValue="">
            <option value="" disabled>
              {dogs.length ? "Choose from the roster" : "Register a dog on the left first"}
            </option>
            {dogs.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.name} · {dog.breed}
              </option>
            ))}
          </select>
          <small className="field-help">
            Only dogs already on the roster. First-time pups need a card on the
            left before we can hold a table.
          </small>
        </label>

        <fieldset className="field service-fieldset">
          <span>Which service?</span>
          <p className="field-help" style={{ margin: 0 }}>
            Read the visit you want — each one is a different length and price.
            Pick one to continue.
          </p>
          <div className="service-picks">
            {GROOMING_SERVICES.map((service) => (
              <label key={service.id} className="service-pick">
                <input
                  type="radio"
                  name="serviceId"
                  value={service.id}
                  required
                />
                <span className="service-pick-body">
                  <strong>{service.name}</strong>
                  <span className="service-pick-meta">
                    {formatPrice(service.price)} · {formatDuration(service.durationMin)}
                  </span>
                  <span className="muted">{service.blurb}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid-2">
          <label className="field">
            <span>Preferred date</span>
            <input type="date" name="date" required min={minDate} />
            <small className="field-help">Pacific calendar date. Closed Sundays.</small>
          </label>
          <label className="field">
            <span>Second-choice date</span>
            <input type="date" name="altDate" required min={minDate} />
            <small className="field-help">
              If the first slot is taken we&apos;ll try this day next.
            </small>
          </label>
        </div>

        <label className="field">
          <span>Arrival window (Pacific)</span>
          <select name="time" required defaultValue="">
            <option value="" disabled>
              Choose a Pacific time slot
            </option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {formatSlotLabel(slot)}
              </option>
            ))}
          </select>
          <small className="field-help">
            9:00 AM – 4:30 PM Pacific. Please arrive a few minutes early so we
            can check in.
          </small>
        </label>

        <div className="grid-2">
          <label className="field">
            <span>Day-of phone</span>
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="Day-of number"
            />
            <small className="field-help">Required so we can reach you on the day.</small>
          </label>
          <label className="field">
            <span>How should we reach you?</span>
            <select name="reachBy" required defaultValue="">
              <option value="" disabled>
                Choose one
              </option>
              <option value="text">Text</option>
              <option value="call">Phone call</option>
              <option value="either">Either is fine</option>
            </select>
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Who is dropping off?</span>
            <input name="dropOff" required placeholder="Who's at the door" />
          </label>
          <label className="field">
            <span>Last groomed (if you know)</span>
            <input type="date" name="lastGroomed" max={minDate} />
            <small className="field-help">Helps us plan the cut. Optional.</small>
          </label>
        </div>

        <label className="field">
          <span>Anything we should know?</span>
          <textarea
            name="notes"
            placeholder="Coat condition, sensitive skin, pickup person, crate, etc."
          />
        </label>

        <label className="check-line">
          <input type="checkbox" name="vaccines" value="yes" required />
          <span>
            Vaccines are current, and I can bring proof if Anna asks at drop-off.
          </span>
        </label>
        <label className="check-line">
          <input type="checkbox" name="cancelAck" value="yes" required />
          <span>
            I understand cancellations are confirmed by email — a form click is
            not enough to take the visit off the book.
          </span>
        </label>

        <button className="btn btn-primary" type="submit" disabled={dogs.length === 0}>
          Submit booking request
        </button>
        <p className="faint" style={{ margin: 0 }}>
          We&apos;ll hold the table once every required field is in. Prefer a
          quicker path? Message the salon and say who, which visit, and when —
          in Pacific time.
        </p>
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
                <div className="muted">{formatVisitWhen(appointment.visitDate, appointment.visitTime)}</div>
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
