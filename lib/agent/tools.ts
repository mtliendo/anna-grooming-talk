import { tool } from "ai";
import { z } from "zod";
import { requestCancelAppointment } from "@/lib/ciba-cancel";
import {
  bookAppointment,
  getAppointment,
  listAppointments,
  saveCalendarEvent,
} from "@/lib/appointments";
import { addDog, findDogByName, listDogs } from "@/lib/dogs";
import { getGoogleConnectUrl } from "@/lib/config";
import { getGoogleAccessToken, isGoogleConnected } from "@/lib/google";
import { createAppointmentReminder } from "@/lib/google-calendar";
import { getService, parseServiceHint } from "@/lib/services";
import type { ChatMeta } from "@/lib/types";

export type ToolEvent = ChatMeta;

export function salonTools(actor: { sub: string }, events: ToolEvent[]) {
  return {
    list_dogs: tool({
      description: "List the signed-in customer's dogs.",
      inputSchema: z.object({}),
      execute: async () => {
        const dogs = await listDogs(actor.sub);
        return dogs.length
          ? dogs.map((d) => `${d.name} (${d.breed}) id=${d.id}`).join("\n")
          : "No dogs on the roster yet. Use add_dog.";
      },
    }),

    add_dog: tool({
      description: "Register a dog on this customer's roster.",
      inputSchema: z.object({
        name: z.string().describe("Dog's name"),
        breed: z.string().describe("Breed"),
        notes: z.string().optional().describe("Coat notes or temperament"),
      }),
      execute: async ({ name, breed, notes }) => {
        const existing = await findDogByName(actor.sub, name);
        if (existing) {
          return `${existing.name} is already on the roster (id=${existing.id}, ${existing.breed}).`;
        }
        const dog = await addDog(actor.sub, { name, breed, notes });
        return `Registered ${dog.name} the ${dog.breed} (id=${dog.id}).`;
      },
    }),

    list_appointments: tool({
      description: "List upcoming appointments for this customer, including any waiting on CIBA confirmation.",
      inputSchema: z.object({}),
      execute: async () => {
        const appointments = await listAppointments(actor.sub);
        if (appointments.length === 0) return "No upcoming appointments.";
        return appointments
          .map((a) => {
            const service = getService(a.serviceId)?.name ?? a.serviceId;
            return `${a.dogName} · ${service} on ${a.visitDate} at ${a.visitTime} (id=${a.id}, status=${a.status})`;
          })
          .join("\n");
      },
    }),

    book_appointment: tool({
      description:
        "Create a grooming appointment after the customer confirms dog, service, date, and time. Services: bath-brush, full-groom, nail-trim.",
      inputSchema: z.object({
        dogName: z.string().describe("Dog name as the customer said it"),
        serviceId: z
          .string()
          .describe("bath-brush | full-groom | nail-trim (or a natural phrase)"),
        visitDate: z.string().describe("YYYY-MM-DD"),
        visitTime: z.string().describe("HH:MM 24h slot"),
        notes: z.string().optional(),
      }),
      execute: async ({ dogName, serviceId, visitDate, visitTime, notes }) => {
        const resolvedService = getService(serviceId)?.id ?? parseServiceHint(serviceId);
        if (!resolvedService) {
          return "Unknown service. Use Bath & Brush, Full Groom, or Nail Trim.";
        }
        let dog = await findDogByName(actor.sub, dogName);
        if (!dog) {
          const dogs = await listDogs(actor.sub);
          dog =
            dogs.find((d) => d.name.toLowerCase().includes(dogName.toLowerCase())) ??
            null;
        }
        if (!dog) {
          return `I don't see a dog named ${dogName}. Register them with add_dog first.`;
        }
        const appointment = await bookAppointment(actor.sub, {
          dogId: dog.id,
          serviceId: resolvedService,
          visitDate,
          visitTime,
          notes,
        });
        events.push({ kind: "booked", appointmentId: appointment.id });
        const service = getService(resolvedService);
        return [
          `Booked ${service?.name ?? resolvedService} for ${dog.name} on ${visitDate} at ${visitTime} (id=${appointment.id}).`,
          "Ask if they want this on Google Calendar. If they say yes, call add_calendar_event with this appointment id.",
        ].join(" ");
      },
    }),

    add_calendar_event: tool({
      description:
        "Add a booked appointment to Google Calendar via Auth0 Token Vault. Call only after the customer agrees. If Calendar is not connected, pause — do not invent success. The UI will show a Connect Google Calendar card.",
      inputSchema: z.object({
        appointmentId: z.string().describe("Appointment id from book_appointment"),
      }),
      execute: async ({ appointmentId }) => {
        const appointment = await getAppointment(actor.sub, appointmentId);
        if (!appointment) {
          return "That appointment is not on this customer's book.";
        }
        if (appointment.calendarEventLink) {
          return `Already on Google Calendar: ${appointment.calendarEventLink}`;
        }

        const connected = await isGoogleConnected();
        if (!connected) {
          const connectUrl = getGoogleConnectUrl("/chat");
          events.push({
            kind: "token_vault",
            connectUrl,
            appointmentId,
          });
          return [
            "TOKEN_VAULT_PERMISSION_REQUIRED.",
            "Google Calendar is not connected. Do not say the event was created.",
            "Tell the customer to click Connect Google Calendar in the card that just appeared.",
            "That starts Auth0 Connected Accounts / Token Vault for Calendar scopes — login did not request those scopes.",
            "After they return, they can ask you to add it again.",
          ].join(" ");
        }

        const token = await getGoogleAccessToken();
        if (!token) {
          const connectUrl = getGoogleConnectUrl("/chat");
          events.push({ kind: "token_vault", connectUrl, appointmentId });
          return "TOKEN_VAULT_PERMISSION_REQUIRED. Token Vault did not return a Google token. Ask them to connect Google Calendar.";
        }

        try {
          const event = await createAppointmentReminder(token, appointment);
          await saveCalendarEvent(actor.sub, appointment.id, event);
          return [
            "Google Calendar event written via Auth0 Token Vault.",
            `Title: ${event.summary ?? "grooming visit"}`,
            event.htmlLink ? `Link: ${event.htmlLink}` : "",
            "Tell the customer it is on their calendar and include the link.",
          ]
            .filter(Boolean)
            .join("\n");
        } catch (error) {
          const message = error instanceof Error ? error.message : "calendar write failed";
          return `Could not write the calendar event (${message}). Do not say it succeeded.`;
        }
      },
    }),

    cancel_appointment: tool({
      description:
        "Cancel an appointment. Starts real Client-Initiated Backchannel Authentication: Auth0 emails the signed-in user. The row is not deleted until they Accept. Do not ask for a second chat confirmation.",
      inputSchema: z.object({
        appointmentId: z
          .string()
          .optional()
          .describe("Appointment id if they named one"),
        dogName: z.string().optional().describe("Dog name if they did not give an id"),
      }),
      execute: async ({ appointmentId, dogName }) => {
        const appointments = await listAppointments(actor.sub);
        let target = appointmentId
          ? appointments.find((a) => a.id === appointmentId)
          : undefined;
        if (!target && dogName) {
          const matches = appointments.filter(
            (a) => a.dogName?.toLowerCase() === dogName.toLowerCase(),
          );
          target = matches[0];
          if (matches.length > 1) {
            return `There are ${matches.length} visits for ${dogName}. Ask which date, then call again with appointmentId.`;
          }
        }
        if (!target && appointments.length === 1) {
          target = appointments[0];
        }
        if (!target) {
          return "I could not tell which appointment to cancel. List them and ask.";
        }

        const result = await requestCancelAppointment(
          target,
          actor.sub,
          appointmentId,
        );
        if (result.pending) {
          events.push({
            kind: "ciba_pending",
            appointmentId: target.id,
            bindingMessage: result.bindingMessage,
          });
        }
        return result.message;
      },
    }),
  };
}
