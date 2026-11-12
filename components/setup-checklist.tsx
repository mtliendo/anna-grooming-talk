import { StatusDot } from "@/components/icons";
import type { EnvStatus } from "@/lib/config";
import { getCallbackUrl, getLogoutUrl, mcpServerUrl } from "@/lib/config";

export function SetupChecklist({ items }: { items: EnvStatus[] }) {
  return (
    <section className="card card-pad card-amber">
      <p className="eyebrow">Setup</p>
      <h1 className="display display-lg">The salon opens once Auth0 and Neon are wired.</h1>
      <p className="lede">
        Fill <span className="mono">.env.local</span> and Vercel env using{" "}
        <span className="mono">SETUP.md</span>. Demo-showcase tenant only —
        never the workshop tenants.
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
          Auth0 URLs tab (Regular Web Application)
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
