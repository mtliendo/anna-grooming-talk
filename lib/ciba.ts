import { sanitizeBindingMessage } from "@/lib/binding-message";
import { auth0Domain } from "@/lib/config";

/**
 * Auth0 sends email when requested_expiry is 301–259200s. ≤300 is Guardian push.
 * https://auth0.com/docs/get-started/applications/configure-client-initiated-backchannel-authentication
 */
export const CIBA_EMAIL_MIN_EXPIRY_SECONDS = 301;
/** ~5 minutes, just above 300 so Auth0 uses email, not Guardian. */
export const CIBA_CANCEL_EXPIRY_SECONDS = 301;

function emailChannelExpirySeconds(requested?: number): number {
  const n = requested ?? CIBA_CANCEL_EXPIRY_SECONDS;
  if (!Number.isFinite(n)) return CIBA_CANCEL_EXPIRY_SECONDS;
  return Math.max(CIBA_EMAIL_MIN_EXPIRY_SECONDS, Math.floor(n));
}

function issuer() {
  return `https://${auth0Domain()}/`;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

/**
 * Real Client-Initiated Backchannel Authentication over email.
 * POST /bc-authorize with login_hint iss_sub, then poll /oauth/token
 * with grant_type urn:openid:params:grant-type:ciba.
 *
 * Pattern matches Auth0's CIBA docs and the working loop in
 * mtliendo/insurance-demo-new — not a chat-UI stand-in.
 */
export async function startCiba(
  sub: string,
  bindingMessage: string,
  options?: { requestedExpirySeconds?: number },
) {
  const cleaned = sanitizeBindingMessage(bindingMessage);
  const requestedExpiry = emailChannelExpirySeconds(
    options?.requestedExpirySeconds,
  );
  const body = new URLSearchParams({
    client_id: requireEnv("AUTH0_CLIENT_ID"),
    client_secret: requireEnv("AUTH0_CLIENT_SECRET"),
    scope: "openid",
    binding_message: cleaned,
    requested_expiry: String(requestedExpiry),
    login_hint: JSON.stringify({
      format: "iss_sub",
      iss: issuer(),
      sub,
    }),
  });

  const res = await fetch(`https://${auth0Domain()}/bc-authorize`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    auth_req_id?: string;
    interval?: number;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.auth_req_id) {
    throw new Error(json.error_description || json.error || "bc-authorize failed");
  }
  return {
    authReqId: json.auth_req_id,
    interval: Number(json.interval ?? 5),
    expiresIn: Number(json.expires_in ?? requestedExpiry),
    bindingMessage: cleaned,
  };
}

export async function pollCiba(authReqId: string) {
  const body = new URLSearchParams({
    grant_type: "urn:openid:params:grant-type:ciba",
    client_id: requireEnv("AUTH0_CLIENT_ID"),
    client_secret: requireEnv("AUTH0_CLIENT_SECRET"),
    auth_req_id: authReqId,
  });

  const res = await fetch(`https://${auth0Domain()}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
    interval?: number;
  };

  if (res.ok && json.access_token) {
    return { status: "approved" as const };
  }

  const error = json.error;
  const interval = json.interval != null ? Number(json.interval) : undefined;
  if (error === "authorization_pending") {
    return { status: "pending" as const, interval, slowDown: false as const };
  }
  if (error === "slow_down") {
    return { status: "pending" as const, interval, slowDown: true as const };
  }
  if (error === "access_denied" || error === "expired_token") {
    return {
      status: "denied" as const,
      reason: error,
      error: json.error_description || error,
    };
  }
  return {
    status: "error" as const,
    error: json.error_description || error || "token poll failed",
  };
}
