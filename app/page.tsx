import Link from "next/link";
import { SetupChecklist } from "@/components/setup-checklist";
import { WelcomeHero } from "@/components/welcome-hero";
import { getSessionSafe } from "@/lib/auth0";
import { getEnvChecklist, isAuth0Configured } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isAuth0Configured()) {
    return <SetupChecklist items={getEnvChecklist()} />;
  }

  const session = await getSessionSafe();
  if (!session?.user?.sub) {
    return <WelcomeHero />;
  }

  const first = session.user.given_name ?? session.user.name?.split(" ")[0];

  return (
    <>
      <section style={{ marginBottom: 22 }}>
        <p className="badge badge-sage">Signed in with Auth0</p>
        <h1 className="display display-lg" style={{ marginTop: 12 }}>
          Welcome back{first ? `, ${first}` : ""}.
        </h1>
        <p className="lede">
          Every dog and visit is scoped to{" "}
          <span className="mono">{session.user.sub}</span>. Walk the talk in
          order: classic form, chatbot, Token Vault, MCP, then CIBA cancel.
        </p>
      </section>
      <div className="grid-3">
        <Link href="/book" className="card card-pad">
          <p className="badge">Beat 2</p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            Classic book
          </h2>
          <p className="muted">The traditional form Anna already had.</p>
        </Link>
        <Link href="/chat" className="card card-pad">
          <p className="badge">Beats 3–4</p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            Chat + Token Vault
          </h2>
          <p className="muted">Conversational booking, then a Calendar pause.</p>
        </Link>
        <Link href="/connect" className="card card-pad">
          <p className="badge">Beats 5–6</p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            MCP + CIBA
          </h2>
          <p className="muted">Grok Bot lists, books, and cancels with email confirmation.</p>
        </Link>
      </div>
    </>
  );
}
