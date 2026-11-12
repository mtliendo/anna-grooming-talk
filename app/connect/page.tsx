import { TalkBeats } from "@/components/talk-beats";
import { APP_BASE_URL, mcpServerUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function ConnectPage() {
  const mcp = mcpServerUrl();
  const origin = APP_BASE_URL;

  return (
    <>
      <TalkBeats active="mcp" />
      <section style={{ marginBottom: 22 }}>
        <p className="badge">Beats 5 &amp; 6</p>
        <h1 className="display display-lg" style={{ marginTop: 12 }}>
          MCP for Grok Bot
        </h1>
        <p className="lede">
          Sign in with Auth0 from the MCP client. List the visit you just booked,
          book another, then cancel — cancel emails a CIBA confirmation and does
          not delete the row until you Accept.
        </p>
      </section>

      <div className="grid-2">
        <section className="card card-pad">
          <h2 className="card-title">Connect</h2>
          <p className="muted">
            Streamable HTTP. Resource identifier must match{" "}
            <span className="mono">AUTH0_AUDIENCE</span>.
          </p>
          <pre className="pre">{mcp}</pre>
          <p className="faint">
            Protected resource metadata:{" "}
            <span className="mono">{origin}/.well-known/oauth-protected-resource</span>
          </p>
        </section>
        <section className="card card-pad">
          <h2 className="card-title">Tools</h2>
          <ul className="stack" style={{ paddingLeft: 18 }}>
            <li>
              <span className="mono">list_appointments</span> — upcoming visits
            </li>
            <li>
              <span className="mono">book_appointment</span> — Bath &amp; Brush / Full Groom / Nail Trim
            </li>
            <li>
              <span className="mono">cancel_appointment</span> — starts CIBA; deletes only after Accept
            </li>
            <li>
              <span className="mono">list_dogs</span> / <span className="mono">add_dog</span>
            </li>
          </ul>
        </section>
      </div>

      <section className="card card-pad" style={{ marginTop: 22 }}>
        <h2 className="card-title">What the audience sees</h2>
        <ol className="stack" style={{ paddingLeft: 18 }}>
          <li>Grok Bot requests Auth0 login (email/password or Google).</li>
          <li>
            <span className="mono">list_appointments</span> shows the visit booked in chat or on the form.
          </li>
          <li>
            <span className="mono">cancel_appointment</span> returns pending — the row is still on{" "}
            <span className="mono">/book</span>.
          </li>
          <li>The signed-in user gets an email. Accept → the visit disappears. Decline → it stays.</li>
        </ol>
      </section>
    </>
  );
}
