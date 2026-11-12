import { GROOMING_SERVICES, formatDuration, formatPrice } from "@/lib/services";
import { TalkBeats } from "@/components/talk-beats";

export function WelcomeHero() {
  return (
    <>
      <TalkBeats active="login" />
      <section className="hero">
        <div>
          <p className="badge badge-terracotta">Focus Otter · Auth0</p>
          <h1 className="display display-xl" style={{ marginTop: 16 }}>
            Trust the agent. Verify the human.
          </h1>
          <p className="lede">
            Anna hired you to modernize the salon. First the classic book — then a
            chatbot, Token Vault for Google Calendar, an Auth0-protected MCP
            server, and real CIBA email before any cancellation lands.
          </p>
          <div className="row">
            <a className="btn btn-primary" href="/auth/login?returnTo=/book">
              Sign in
            </a>
            <a
              className="btn btn-ghost"
              href="/auth/login?screen_hint=signup&returnTo=/book"
            >
              Create a customer account
            </a>
            <a className="btn btn-ghost" href="/auth/login?connection=google-oauth2&returnTo=/book">
              Continue with Google
            </a>
          </div>
        </div>
        <div className="card card-pad">
          <p className="badge">Today&apos;s menu</p>
          <h2 className="card-title" style={{ marginTop: 12 }}>
            Three services. One identity.
          </h2>
          <div className="stack" style={{ marginTop: 14 }}>
            {GROOMING_SERVICES.map((service) => (
              <div key={service.id} className="service-tile">
                <strong>{service.name}</strong>
                <span className="muted">
                  {formatPrice(service.price)} · {formatDuration(service.durationMin)}
                </span>
                <p className="faint" style={{ margin: "6px 0 0" }}>
                  {service.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
