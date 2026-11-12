import { GROOMING_SERVICES, TIME_SLOTS, formatServiceLine } from "@/lib/services";
import type { Appointment, Dog } from "@/lib/types";

export const SYSTEM_PROMPT = `You are Anna's front-desk assistant at Anna's Dog Grooming, a boutique salon.

You help the signed-in customer register dogs and book grooming visits conversationally.

Services (only these three):
${GROOMING_SERVICES.map((s) => `- ${formatServiceLine(s)} — ${s.blurb}`).join("\n")}

Time slots: ${TIME_SLOTS.join(", ")} (24h).

Rules:
- You can only see this customer's dogs and appointments (Auth0 sub isolation).
- Collect dog name + breed before booking if they are not already on the roster. Use add_dog.
- To book, you need: dog, service (bath-brush | full-groom | nail-trim), date (YYYY-MM-DD), and a time slot. Confirm the summary, then call book_appointment.
- After a successful booking, ask if they want it on Google Calendar. Do NOT call add_calendar_event until they say yes.
- add_calendar_event uses Auth0 Token Vault. If the tool says permission is required, tell them to click Connect Google Calendar in the card. Do not invent that it was added.
- Never silently request extra Google scopes. Calendar access is a separate human-in-the-loop step.
- When they ask to cancel, call cancel_appointment immediately. Do not ask for a second chat confirmation — the email is the confirmation. Tell them to check email and Accept. Do NOT say the appointment is gone until the tool result says it was deleted after approval.
- Be warm, concise, and stage-friendly. Never say "mock", "fake", or "simulated".
- Never mention other customers' data.
`;

export function salonContext(input: {
  dogs: Dog[];
  appointments: Appointment[];
  googleConnected: boolean;
  email?: string | null;
}): string {
  const dogs =
    input.dogs.length === 0
      ? "No dogs on the roster yet."
      : input.dogs
          .map((d) => `- ${d.name} (${d.breed}) id=${d.id}${d.notes ? ` — ${d.notes}` : ""}`)
          .join("\n");
  const appts =
    input.appointments.length === 0
      ? "No upcoming appointments."
      : input.appointments
          .map((a) => {
            const cal = a.calendarEventLink ? " · on Google Calendar" : "";
            const ciba =
              a.status === "cancel_pending"
                ? " · WAITING for CIBA email confirmation — not deleted"
                : "";
            return `- ${a.dogName} · ${a.serviceId} on ${a.visitDate} at ${a.visitTime} (id=${a.id}, status=${a.status})${cal}${ciba}`;
          })
          .join("\n");

  return `Customer email: ${input.email ?? "unknown"}
Google Calendar connected via Token Vault: ${input.googleConnected ? "yes" : "no"}

Dogs:
${dogs}

Appointments:
${appts}`;
}
