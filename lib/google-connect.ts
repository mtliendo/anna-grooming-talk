import {
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_CALENDAR_SCOPES,
  GOOGLE_CONNECTION,
  getGoogleConnectUrl,
} from "@/lib/config";

export {
  GOOGLE_CONNECTION,
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_CALENDAR_SCOPES,
};

/** Host-only Token Vault connect. Calendar events scope lives here, not on login. */
export function connectAccountHref(returnTo = "/chat"): string {
  return getGoogleConnectUrl(returnTo);
}
