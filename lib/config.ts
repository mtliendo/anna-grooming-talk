export const APP_BASE_URL = (
  process.env.APP_BASE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/** Canonical talk URLs shown to clients. Never localhost or a preview host. */
export const PRODUCTION_ORIGIN = "https://anna-grooming-talk.vercel.app";
export const PRODUCTION_MCP_URL = `${PRODUCTION_ORIGIN}/mcp`;
export const PRODUCTION_PRM_URL = `${PRODUCTION_ORIGIN}/.well-known/oauth-protected-resource`;

export const GOOGLE_CONNECTION = "google-oauth2";

/**
 * Calendar write scope for Connected Accounts / Token Vault only.
 * Do not send openid/profile/email/offline_access here — those are login
 * scopes. Marvel's working Connect URL is a single Calendar API scope.
 */
export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";
export const GOOGLE_CALENDAR_SCOPES = [GOOGLE_CALENDAR_SCOPE] as const;

export const MCP_SCOPES = [
  "openid",
  "profile",
  "email",
  "tool:list_dogs",
  "tool:add_dog",
  "tool:list_appointments",
  "tool:book_appointment",
  "tool:cancel_appointment",
] as const;

const PLACEHOLDERS: Record<string, string[]> = {
  AUTH0_SECRET: ["replace-with-openssl-rand-hex-32", "change-me"],
  AUTH0_DOMAIN: ["your-tenant", "example.auth0.com"],
  AUTH0_CLIENT_ID: ["your-client-id"],
  AUTH0_CLIENT_SECRET: ["your-client-secret"],
};

export type EnvStatus = {
  name: string;
  required: boolean;
  configured: boolean;
  hint: string;
};

function isConfigured(name: string, value: string | undefined): boolean {
  if (!value || value.trim() === "") return false;
  const needles = PLACEHOLDERS[name] ?? [];
  const lower = value.toLowerCase();
  return !needles.some((needle) => lower.includes(needle.toLowerCase()));
}

export function auth0Domain(): string {
  return (process.env.AUTH0_DOMAIN ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

export function mcpServerUrl(): string {
  return (
    process.env.MCP_SERVER_URL?.trim() ||
    process.env.AUTH0_AUDIENCE?.trim() ||
    `${APP_BASE_URL}/mcp`
  ).replace(/\/$/, "");
}

export function getEnvChecklist(): EnvStatus[] {
  return [
    {
      name: "AUTH0_SECRET",
      required: true,
      configured: isConfigured("AUTH0_SECRET", process.env.AUTH0_SECRET),
      hint: "Generate with `openssl rand -hex 32`",
    },
    {
      name: "APP_BASE_URL",
      required: true,
      configured: Boolean(process.env.APP_BASE_URL?.trim()),
      hint: "Public origin, no trailing slash. Production: https://<vercel-domain>",
    },
    {
      name: "AUTH0_DOMAIN",
      required: true,
      configured: isConfigured("AUTH0_DOMAIN", process.env.AUTH0_DOMAIN),
      hint: "demo-showcase tenant hostname only, no https://",
    },
    {
      name: "AUTH0_CLIENT_ID",
      required: true,
      configured: isConfigured("AUTH0_CLIENT_ID", process.env.AUTH0_CLIENT_ID),
      hint: "Regular Web Application → Settings",
    },
    {
      name: "AUTH0_CLIENT_SECRET",
      required: true,
      configured: isConfigured(
        "AUTH0_CLIENT_SECRET",
        process.env.AUTH0_CLIENT_SECRET,
      ),
      hint: "Same Regular Web Application. Never commit this.",
    },
    {
      name: "AUTH0_AUDIENCE",
      required: false,
      configured: Boolean(process.env.AUTH0_AUDIENCE?.trim()),
      hint: "MCP resource identifier, e.g. https://<domain>/mcp",
    },
    {
      name: "DATABASE_URL",
      required: true,
      configured: Boolean(process.env.DATABASE_URL?.trim()),
      hint: "Neon pooled URL with ?sslmode=require",
    },
    {
      name: "AI_GATEWAY_API_KEY",
      required: false,
      configured: Boolean(
        process.env.AI_GATEWAY_API_KEY?.trim() ||
          process.env.VERCEL_OIDC_TOKEN?.trim(),
      ),
      hint: "Local AI Gateway key, or Vercel OIDC on deploy",
    },
  ];
}

export function isAuth0Configured(): boolean {
  return getEnvChecklist()
    .filter((item) =>
      [
        "AUTH0_SECRET",
        "APP_BASE_URL",
        "AUTH0_DOMAIN",
        "AUTH0_CLIENT_ID",
        "AUTH0_CLIENT_SECRET",
      ].includes(item.name),
    )
    .every((item) => item.configured);
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, MCP-Protocol-Version, mcp-protocol-version",
    "Access-Control-Expose-Headers": "WWW-Authenticate, mcp-session-id",
    "Content-Type": "application/json",
  };
}

export function getGoogleConnectUrl(returnTo = "/chat"): string {
  const params = new URLSearchParams({
    connection: GOOGLE_CONNECTION,
    returnTo,
    scopes: GOOGLE_CALENDAR_SCOPE,
  });
  return `/auth/connect?${params.toString()}`;
}

export function getCallbackUrl(): string {
  return `${APP_BASE_URL}/auth/callback`;
}

export function getLogoutUrl(): string {
  return APP_BASE_URL;
}
