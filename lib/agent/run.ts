import { generateText, stepCountIs } from "ai";
import { chatModel } from "@/lib/agent/model";
import { SYSTEM_PROMPT, salonContext } from "@/lib/agent/system-prompt";
import { salonTools, type ToolEvent } from "@/lib/agent/tools";
import { listAppointments } from "@/lib/appointments";
import { listDogs } from "@/lib/dogs";
import { isGoogleConnected } from "@/lib/google";
import type { ChatMessage } from "@/lib/types";

const MAX_OUTPUT_TOKENS = 4000;
const MAX_TURNS = 8;

export async function runSalonAgent(
  history: ChatMessage[],
  actor: { sub: string; email?: string | null },
): Promise<{ reply: string; events: ToolEvent[] }> {
  const firstUser = history.findIndex((m) => m.role === "user");
  const trimmed = firstUser >= 0 ? history.slice(firstUser) : [];
  const events: ToolEvent[] = [];

  async function instructionsForCurrent() {
    const [dogs, appointments, googleConnected] = await Promise.all([
      listDogs(actor.sub),
      listAppointments(actor.sub),
      isGoogleConnected(),
    ]);
    return (
      SYSTEM_PROMPT +
      "\n\n" +
      salonContext({
        dogs,
        appointments,
        googleConnected,
        email: actor.email,
      })
    );
  }

  const result = await generateText({
    model: chatModel(),
    system: await instructionsForCurrent(),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    stopWhen: stepCountIs(MAX_TURNS),
    tools: salonTools(actor, events),
    messages: trimmed.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    prepareStep: async () => ({
      system: await instructionsForCurrent(),
    }),
    providerOptions: {
      gateway: {
        tags: ["feature:salon-agent", "app:anna-grooming-talk"],
      },
    },
  });

  const reply = result.text.trim();
  return {
    reply: reply || "I could not generate a response. Please try again.",
    events,
  };
}
