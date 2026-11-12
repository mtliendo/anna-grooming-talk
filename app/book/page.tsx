import { AppointmentPanel } from "@/components/appointment-panel";
import { CibaBookPoller } from "@/components/ciba-book-poller";
import { DogPanel } from "@/components/dog-panel";
import { getSessionSafe } from "@/lib/auth0";
import { isAuth0Configured } from "@/lib/config";
import { loadSalonSnapshot } from "@/lib/salon";
import type { Appointment, Dog } from "@/lib/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function BookView({
  dogs,
  appointments,
  cibaPending,
}: {
  dogs: Dog[];
  appointments: Appointment[];
  cibaPending: boolean;
}) {
  return (
    <div className="shell page">
      <CibaBookPoller active={cibaPending} />
      <header className="page-head">
        <p className="eyebrow">The book</p>
        <h1 className="display display-lg">
          Book a <em>visit</em>
        </h1>
        <p className="lede">
          Register your dogs, then complete the visit request — service, two
          dates, a Pacific time slot, and day-of details. If you cancel, we
          email you first; the visit stays until you accept.
        </p>
      </header>
      <div className="grid-2 book-grid">
        <DogPanel dogs={dogs} />
        <AppointmentPanel dogs={dogs} appointments={appointments} />
      </div>
    </div>
  );
}

export default async function BookPage() {
  if (!isAuth0Configured()) redirect("/");
  const session = await getSessionSafe();
  if (!session?.user?.sub) redirect("/auth/login?returnTo=/book");

  const snapshot = await loadSalonSnapshot(session.user.sub);
  const cibaPending = snapshot.appointments.some(
    (a) => a.status === "cancel_pending" || a.cancelCibaStatus === "pending",
  );

  return (
    <BookView
      dogs={snapshot.dogs}
      appointments={snapshot.appointments}
      cibaPending={cibaPending}
    />
  );
}
