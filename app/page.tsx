import Link from "next/link";
import { SetupChecklist } from "@/components/setup-checklist";
import { WelcomeHero } from "@/components/welcome-hero";
import { getSessionSafe } from "@/lib/auth0";
import { getEnvChecklist, isAuth0Configured } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isAuth0Configured()) {
    return (
      <div className="shell page">
        <SetupChecklist items={getEnvChecklist()} />
      </div>
    );
  }

  const session = await getSessionSafe();
  if (!session?.user?.sub) {
    return <WelcomeHero />;
  }

  const first = session.user.given_name ?? session.user.name?.split(" ")[0];

  return (
    <>
      <WelcomeHero />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="shell signed-in-intro">
          <p className="eyebrow">Signed in</p>
          <h2 className="display display-lg">
            Welcome back{first ? `, ${first}` : ""}.
          </h2>
          <p className="lede">
            Your dogs and visits live on this account. Book a table, message the
            salon, or connect a calendar when you&apos;re ready.
          </p>
          <div className="path-grid">
            <Link href="/book" className="path-card">
              <h2>Book a visit</h2>
              <p>Register a dog and pick Bath &amp; Brush, Full Groom, or Nail Trim.</p>
            </Link>
            <Link href="/chat" className="path-card">
              <h2>Message the salon</h2>
              <p>Same book, in conversation. Calendar waits for your say-so.</p>
            </Link>
            <Link href="/connect" className="path-card">
              <h2>Other tools</h2>
              <p>MCP endpoint for assistants. Quiet, on purpose.</p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
