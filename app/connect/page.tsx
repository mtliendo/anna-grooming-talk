import { APP_BASE_URL, mcpServerUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function ConnectPage() {
  const mcp = mcpServerUrl();
  const origin = APP_BASE_URL;

  return (
    <div className="shell page">
      <header className="page-head">
        <p className="eyebrow">For other tools</p>
        <h1 className="display display-lg">MCP</h1>
        <p className="lede">
          Assistants can list, book, and cancel on this account after Auth0
          sign-in. A cancel still emails you; the visit is not removed until
          you accept.
        </p>
      </header>

      <div className="grid-2">
        <section className="card card-pad">
          <p className="eyebrow">Connect</p>
          <h2 className="card-title">Streamable HTTP</h2>
          <p className="muted">
            Resource identifier must match <span className="mono">AUTH0_AUDIENCE</span>.
          </p>
          <pre className="pre">{mcp}</pre>
          <p className="faint">
            Protected resource metadata
            <br />
            <span className="mono">
              {origin}/.well-known/oauth-protected-resource
            </span>
          </p>
        </section>
        <section className="card card-pad">
          <p className="eyebrow">Tools</p>
          <h2 className="card-title">What can be called</h2>
          <dl className="tool-list">
            <div>
              <dt className="mono">list_appointments</dt>
              <dd>Upcoming visits, including ones waiting on email</dd>
            </div>
            <div>
              <dt className="mono">book_appointment</dt>
              <dd>Bath &amp; Brush / Full Groom / Nail Trim</dd>
            </div>
            <div>
              <dt className="mono">cancel_appointment</dt>
              <dd>Starts an email confirmation; deletes only after Accept</dd>
            </div>
            <div>
              <dt className="mono">list_dogs / add_dog</dt>
              <dd>Optional roster helpers</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
