import { AppointmentPanel } from "@/components/appointment-panel";
import { CibaBookPoller } from "@/components/ciba-book-poller";
import { DogPanel } from "@/components/dog-panel";
import { TalkBeats } from "@/components/talk-beats";
import { getSessionSafe } from "@/lib/auth0";
import { isAuth0Configured } from "@/lib/config";
import { loadSalonSnapshot } from "@/lib/salon";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  if (!isAuth0Configured()) redirect("/");
  const session = await getSessionSafe();
  if (!session?.user?.sub) redirect("/auth/login?returnTo=/book");

  const snapshot = await loadSalonSnapshot(session.user.sub);
  const cibaPending = snapshot.appointments.some(
    (a) => a.status === "cancel_pending" || a.cancelCibaStatus === "pending",
  );

  return (
    <>
      <CibaBookPoller active={cibaPending} />
      <TalkBeats active="form" />
      <section style={{ marginBottom: 22 }}>
        <p className="badge">Beat 2 · the before</p>
        <h1 className="display display-lg" style={{ marginTop: 12 }}>
          Anna&apos;s original book
        </h1>
        <p className="lede">
          Register dogs and book Bath &amp; Brush, Full Groom, or Nail Trim.
          Then hire the presenter to add a chatbot, Token Vault, MCP, and CIBA.
        </p>
      </section>
      <div className="grid-2">
        <DogPanel dogs={snapshot.dogs} />
        <AppointmentPanel dogs={snapshot.dogs} appointments={snapshot.appointments} />
      </div>
    </>
  );
}
