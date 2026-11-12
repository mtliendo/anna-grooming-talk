import { getAuth0 } from "@/lib/auth0";
import { GOOGLE_CONNECTION } from "@/lib/google-connect";

export { GOOGLE_CONNECTION, connectAccountHref } from "@/lib/google-connect";

export async function isGoogleConnected(): Promise<boolean> {
  try {
    await getAuth0().getAccessTokenForConnection({
      connection: GOOGLE_CONNECTION,
    });
    return true;
  } catch {
    return false;
  }
}

export async function getGoogleAccessToken(): Promise<string | null> {
  try {
    const { token } = await getAuth0().getAccessTokenForConnection({
      connection: GOOGLE_CONNECTION,
    });
    return token ?? null;
  } catch {
    return null;
  }
}
