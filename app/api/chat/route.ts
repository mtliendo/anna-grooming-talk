import { NextResponse } from "next/server";
import { getSessionSafe } from "@/lib/auth0";
import { addMessage, clearMessages, listMessages } from "@/lib/chat";
import { runSalonAgent } from "@/lib/agent/run";
import { loadSalonSnapshot } from "@/lib/salon";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getSessionSafe();
  if (!session?.user?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = (await request.json()) as { message?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const sub = session.user.sub;
  await addMessage(sub, "user", message.trim());
  const history = await listMessages(sub);

  try {
    const { reply, events } = await runSalonAgent(history, {
      sub,
      email: session.user.email,
    });
    await addMessage(sub, "assistant", reply, events.at(-1) ?? null);
    const snapshot = await loadSalonSnapshot(sub, { includeChat: true });
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Agent error:", error);
    const fallback =
      "Sorry, I hit a snag talking to the model. Check AI_GATEWAY_API_KEY (or Vercel OIDC) and try again.";
    await addMessage(sub, "assistant", fallback);
    const snapshot = await loadSalonSnapshot(sub, { includeChat: true });
    return NextResponse.json(snapshot, { status: 500 });
  }
}

/** Fresh transcript for this customer. Dogs, bookings, and Calendar stay. */
export async function DELETE() {
  const session = await getSessionSafe();
  if (!session?.user?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearMessages(session.user.sub);
  const snapshot = await loadSalonSnapshot(session.user.sub, { includeChat: true });
  return NextResponse.json(snapshot);
}
