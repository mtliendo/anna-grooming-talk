/** Booking chatbot model via the Vercel AI Gateway. */
export const DEFAULT_CHAT_MODEL = "anthropic/claude-sonnet-4.5";

export function chatModel(): string {
  return process.env.AI_GATEWAY_MODEL?.trim() || DEFAULT_CHAT_MODEL;
}
