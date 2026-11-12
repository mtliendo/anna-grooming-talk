import { CopyableUrl } from "@/components/copyable-url";
import { PRODUCTION_MCP_URL, PRODUCTION_PRM_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function ConnectPage() {
  return (
    <div className="shell page">
      <header className="page-head">
        <p className="eyebrow">For assistants</p>
        <h1 className="display display-lg">A quiet door for other tools</h1>
        <p className="lede">
          Point an assistant at this address. After you sign in, it can list,
          book, and cancel visits. A cancel still emails you — the visit stays
          until you accept.
        </p>
      </header>

      <section className="card card-pad connect-endpoint">
        <p className="eyebrow">Connect</p>
        <h2 className="card-title">Salon endpoint</h2>
        <p className="muted">
          This is the public address assistants use. Sign-in is required.
        </p>
        <CopyableUrl url={PRODUCTION_MCP_URL} label="Endpoint" />
        <CopyableUrl
          url={PRODUCTION_PRM_URL}
          label="Protected resource metadata"
        />
      </section>

      <section className="card card-pad" style={{ marginTop: 20 }}>
        <p className="eyebrow">What it can do</p>
        <h2 className="card-title">Same book as the form</h2>
        <dl className="tool-list tool-list-grid">
          <div>
            <dt className="mono">list_appointments</dt>
            <dd>Upcoming visits, including ones waiting on email</dd>
          </div>
          <div>
            <dt className="mono">book_appointment</dt>
            <dd>Bath &amp; Brush, Full Groom, or Nail Trim</dd>
          </div>
          <div>
            <dt className="mono">cancel_appointment</dt>
            <dd>Starts an email confirmation; deletes only after you accept</dd>
          </div>
          <div>
            <dt className="mono">list_dogs / add_dog</dt>
            <dd>Optional roster helpers</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
