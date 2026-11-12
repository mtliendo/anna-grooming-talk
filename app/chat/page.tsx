import { ChatClient } from "@/components/chat-client";
import { TalkBeats } from "@/components/talk-beats";
import { getSessionSafe } from "@/lib/auth0";
import { isAuth0Configured } from "@/lib/config";
import { loadSalonSnapshot } from "@/lib/salon";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  if (!isAuth0Configured()) redirect("/");
  const session = await getSessionSafe();
  if (!session?.user?.sub) redirect("/auth/login?returnTo=/chat");

  const snapshot = await loadSalonSnapshot(session.user.sub, { includeChat: true });

  return (
    <>
      <TalkBeats active="chat" />
      <section style={{ marginBottom: 22 }}>
        <p className="badge">Beats 3 &amp; 4</p>
        <h1 className="display display-lg" style={{ marginTop: 12 }}>
          The assistant Anna hired
        </h1>
        <p className="lede">
          Book in conversation. When the agent wants Calendar, it pauses for
          Token Vault. Cancel still waits on CIBA email — never a chat-only yes.
        </p>
      </section>
      <ChatClient initial={snapshot} email={session.user.email} />
    </>
  );
}
