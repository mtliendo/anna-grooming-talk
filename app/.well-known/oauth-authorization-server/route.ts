import { discoverAuthorizationServerMetadata } from "@modelcontextprotocol/sdk/client/auth.js";
import { auth0Domain, corsHeaders } from "@/lib/config";

export const dynamic = "force-dynamic";

async function handler() {
  const domain = auth0Domain();
  if (!domain) {
    return new Response(JSON.stringify({ error: "AUTH0_DOMAIN is not set" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
  const oauthMetadata = await discoverAuthorizationServerMetadata(
    new URL(`https://${domain}`).toString(),
  );
  return new Response(JSON.stringify(oauthMetadata), { headers: corsHeaders() });
}

function optionsHandler() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export { handler as GET, optionsHandler as OPTIONS };
