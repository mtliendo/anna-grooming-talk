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
    <div className="shell page">
      <header className="page-head">
        <p className="eyebrow">Front desk</p>
        <h1 className="display display-lg">
          Message the <em>salon</em>
        </h1>
        <p className="lede">
          Tell us who needs a bath. We&apos;ll book the same visits as the form.
          Calendar access and cancellations both pause for you — never a silent
          yes.
        </p>
      </header>
      <ChatClient initial={snapshot} email={session.user.email} />
    </div>
  );
}
