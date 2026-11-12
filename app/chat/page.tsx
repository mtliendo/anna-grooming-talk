import { ChatClient } from "@/components/chat-client";
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
    <div className="shell page page-chat">
      <header className="page-head">
        <p className="eyebrow">Front desk</p>
        <h1 className="display display-lg">
          Message the <em>salon</em>
        </h1>
        <p className="lede">
          Tell us who needs a bath — one small question at a time, in Pacific
          time. Same visits as the form, without the long request.
        </p>
      </header>
      <ChatClient initial={snapshot} email={session.user.email} />
    </div>
  );
}
