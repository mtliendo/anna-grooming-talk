import { GOOGLE_CALENDAR_SCOPES, GOOGLE_CONNECTION } from "@/lib/config";

export { GOOGLE_CONNECTION, GOOGLE_CALENDAR_SCOPES };

export function connectAccountHref(returnTo = "/chat"): string {
  const params = new URLSearchParams({
    connection: GOOGLE_CONNECTION,
    returnTo,
  });
  for (const scope of GOOGLE_CALENDAR_SCOPES) {
    params.append("scopes", scope);
  }
  return `/auth/connect?${params.toString()}`;
}
