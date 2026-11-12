import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import { isAuth0Configured } from "@/lib/config";

/**
 * Login scopes stay identity-only. Google Calendar is requested later via
 * Connected Accounts (`/auth/connect`) so Token Vault never silently
 * expands scopes on Universal Login.
 */
export const LOGIN_SCOPES = "openid profile email offline_access";

let client: Auth0Client | null = null;

export function getAuth0(): Auth0Client {
  if (!isAuth0Configured()) {
    throw new Error(
      "Auth0 is not configured yet. Copy .env.example to .env.local.",
    );
  }

  if (!client) {
    client = new Auth0Client({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      secret: process.env.AUTH0_SECRET,
      appBaseUrl: process.env.APP_BASE_URL,
      enableConnectAccountEndpoint: true,
      authorizationParameters: {
        scope: LOGIN_SCOPES,
      },
      async onCallback(error, ctx) {
        const appBaseUrl =
          ctx.appBaseUrl ?? process.env.APP_BASE_URL ?? "http://localhost:3000";
        if (error) {
          const path =
            ctx.responseType === "connect_code" ||
            (ctx.returnTo ?? "").startsWith("/chat")
              ? "/chat"
              : "/";
          return NextResponse.redirect(
            new URL(
              `${path}?error=${encodeURIComponent(error.message)}`,
              appBaseUrl,
            ),
          );
        }
        return NextResponse.redirect(
          new URL(ctx.returnTo ?? "/", appBaseUrl),
        );
      },
    });
  }

  return client;
}

export async function getSessionSafe() {
  if (!isAuth0Configured()) return null;
  try {
    return await getAuth0().getSession();
  } catch {
    return null;
  }
}
