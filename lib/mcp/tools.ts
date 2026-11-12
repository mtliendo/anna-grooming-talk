import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { requireScopes } from "@/lib/mcp/auth";
import { addDog, findDogByName, listDogs } from "@/lib/dogs";
import {
  bookAppointment,
  getAppointment,
  listAppointments,
} from "@/lib/appointments";
import { requestCancelAppointment } from "@/lib/ciba-cancel";
import { formatVisitWhen, resolveVisitWhen } from "@/lib/pacific";
import { getService, parseServiceHint } from "@/lib/services";

const emptySchema = {} as const;

const addDogSchema = {
  name: z.string().describe("Dog name"),
  breed: z.string().describe("Breed"),
  notes: z.string().optional().describe("Optional notes"),
} as const;

const bookSchema = {
  dogName: z.string().describe("Dog name"),
  service: z
    .string()
    .describe("bath-brush | full-groom | nail-trim or a natural phrase"),
  date: z
    .string()
    .describe("Visit date in America/Los_Angeles (Pacific / California)"),
  time: z
    .string()
    .describe("Visit time in America/Los_Angeles (Pacific / California)"),
  notes: z.string().optional(),
} as const;

const cancelSchema = {
  appointmentId: z.string().optional().describe("Appointment UUID"),
  dogName: z.string().optional().describe("Dog name if id is unknown"),
} as const;

function text(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
      },
    ],
  };
}

/**
 * MCP tools for Grok Bot / Inspector. Cancel goes through real CIBA —
 * the appointment is not deleted until the user Accepts the email.
 */
export function registerSalonTools(server: McpServer) {
  server.registerTool(
    "list_dogs",
    {
      title: "List dogs",
      description: "List dogs on the signed-in customer's roster.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true },
    },
    requireScopes<typeof emptySchema>(["tool:list_dogs"], async (_payload, { authInfo }) => {
      const dogs = await listDogs(authInfo.extra.sub);
      return text({ dogs, count: dogs.length });
    }),
  );

  server.registerTool(
    "add_dog",
    {
      title: "Add dog",
      description: "Register a dog for the signed-in customer.",
      inputSchema: addDogSchema,
      annotations: { readOnlyHint: false },
    },
    requireScopes<typeof addDogSchema>(
      ["tool:add_dog"],
      async ({ name, breed, notes }, { authInfo }) => {
        const existing = await findDogByName(authInfo.extra.sub, name);
        if (existing) return text({ already: true, dog: existing });
        const dog = await addDog(authInfo.extra.sub, { name, breed, notes });
        return text({ dog });
      },
    ),
  );

  server.registerTool(
    "list_appointments",
    {
      title: "List appointments",
      description:
        "List upcoming grooming appointments, including any waiting on CIBA cancel confirmation.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true },
    },
    requireScopes<typeof emptySchema>(["tool:list_appointments"], async (_payload, { authInfo }) => {
      const appointments = await listAppointments(authInfo.extra.sub);
      return text({
        timezone: "America/Los_Angeles",
        appointments: appointments.map((a) => ({
          id: a.id,
          dog: a.dogName,
          service: getService(a.serviceId)?.name ?? a.serviceId,
          date: a.visitDate,
          time: a.visitTime,
          when: formatVisitWhen(a.visitDate, a.visitTime),
          timezone: "America/Los_Angeles",
          status: a.status,
          calendar: a.calendarEventLink,
          ciba: a.cancelCibaStatus,
        })),
      });
    }),
  );

  server.registerTool(
    "book_appointment",
    {
      title: "Book appointment",
      description:
        "Book Bath & Brush, Full Groom, or Nail Trim for a dog already on the roster.",
      inputSchema: bookSchema,
      annotations: { readOnlyHint: false },
    },
    requireScopes<typeof bookSchema>(
      ["tool:book_appointment"],
      async ({ dogName, service, date, time, notes }, { authInfo }) => {
        const serviceId = getService(service)?.id ?? parseServiceHint(service);
        if (!serviceId) {
          return text({
            error: "Unknown service. Use Bath & Brush, Full Groom, or Nail Trim.",
          });
        }
        const dog = await findDogByName(authInfo.extra.sub, dogName);
        if (!dog) {
          return text({
            error: `No dog named ${dogName}. Call add_dog first.`,
          });
        }
        const when = resolveVisitWhen(date, time);
        if (!when.ok) {
          return text({ error: when.error });
        }
        const appointment = await bookAppointment(authInfo.extra.sub, {
          dogId: dog.id,
          serviceId,
          visitDate: when.date,
          visitTime: when.time,
          notes,
        });
        return text({
          booked: true,
          timezone: "America/Los_Angeles",
          appointment: {
            id: appointment.id,
            dog: dog.name,
            service: getService(serviceId)?.name,
            date: when.date,
            time: when.time,
            when: formatVisitWhen(when.date, when.time),
          },
        });
      },
    ),
  );

  server.registerTool(
    "cancel_appointment",
    {
      title: "Cancel appointment",
      description:
        "Start Client-Initiated Backchannel Authentication to cancel. Auth0 emails the signed-in user. The appointment is NOT deleted until they Accept. Do not claim it is gone yet.",
      inputSchema: cancelSchema,
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    requireScopes<typeof cancelSchema>(
      ["tool:cancel_appointment"],
      async ({ appointmentId, dogName }, { authInfo }) => {
        const appointments = await listAppointments(authInfo.extra.sub);
        let target = appointmentId
          ? await getAppointment(authInfo.extra.sub, appointmentId)
          : null;
        if (!target && dogName) {
          target =
            appointments.find(
              (a) => a.dogName?.toLowerCase() === dogName.toLowerCase(),
            ) ?? null;
        }
        if (!target && appointments.length === 1) target = appointments[0];
        if (!target) {
          return text({
            error: "Could not identify the appointment. Call list_appointments.",
          });
        }
        const result = await requestCancelAppointment(
          target,
          authInfo.extra.sub,
          appointmentId,
        );
        return text({
          ciba: true,
          pending: result.pending,
          deleted: false,
          bindingMessage: result.bindingMessage,
          message: result.message,
          appointmentId: target.id,
        });
      },
    ),
  );
}
