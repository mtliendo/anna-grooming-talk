import { StatusDot } from "@/components/icons";
import type { EnvStatus } from "@/lib/config";
import { getCallbackUrl, getLogoutUrl, mcpServerUrl } from "@/lib/config";

export function SetupChecklist({ items }: { items: EnvStatus[] }) {
  return (
    <section className="card card-pad card-amber">
      <p className="badge badge-terracotta">Talk setup needed</p>
      <h1 className="display display-lg" style={{ marginTop: 12 }}>
        Wire Auth0 + Neon, then this salon opens.
      </h1>
      <p className="lede">
        The app builds without secrets. Fill <span className="mono">.env.local</span>{" "}
        (and Vercel env) using the checklist in <span className="mono">SETUP.md</span>.
        Use the <strong>demo-showcase</strong> tenant — never the workshop tenants.
      </p>
      <ul className="setup-list">
        {items.map((item) => (
          <li
            key={item.name}
            className={`setup-item ${item.configured ? "ok" : "missing"}`}
          >
            <StatusDot ok={item.configured} />
            <div>
              <div>
                <span className="mono">{item.name}</span>
                {item.required ? "" : " · optional"}
              </div>
              <div className="faint">{item.hint}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="stack" style={{ marginTop: 18 }}>
        <p className="muted" style={{ margin: 0 }}>
          Auth0 URLs tab (Regular Web Application):
        </p>
        <pre className="pre">{`Allowed Callback URLs
${getCallbackUrl()}

Allowed Logout URLs
${getLogoutUrl()}

Allowed Web Origins
${getLogoutUrl()}

MCP resource identifier
${mcpServerUrl()}`}</pre>
      </div>
    </section>
  );
}
