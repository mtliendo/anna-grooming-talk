import { getGoogleConnectUrl } from "@/lib/config";

export function CalendarCard({
  connected,
  email,
}: {
  connected: boolean;
  email?: string | null;
}) {
  const connectHref = getGoogleConnectUrl("/chat");

  return (
    <section
      className={`card card-pad ${connected ? "card-sage" : "card-amber"}`}
      style={{ marginBottom: 22 }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className={connected ? "badge badge-sage" : "badge badge-terracotta"}>
            {connected ? "Token Vault connected" : "Calendar scopes not granted"}
          </p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            Google Calendar
          </h2>
          <p className="muted" style={{ margin: 0, maxWidth: "62ch" }}>
            {connected
              ? "Auth0 Token Vault is holding the Google refresh token. The assistant can write a reminder only after you agree in chat."
              : "Login never asked for Calendar. When the assistant wants to add an event, it pauses here — Connected Accounts / Token Vault is the extra consent."}
          </p>
          {email ? (
            <p className="faint" style={{ margin: "8px 0 0" }}>
              Connect as <span className="mono">{email}</span>
            </p>
          ) : null}
        </div>
        <a className="btn btn-primary" href={connectHref}>
          {connected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
        </a>
      </div>
    </section>
  );
}
