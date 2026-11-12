import { ProtectedResourceMetadataBuilder } from "@auth0/auth0-api-js";
import { MCP_SCOPES, auth0Domain, corsHeaders, mcpServerUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

function handler() {
  const domain = auth0Domain();
  const metadata = new ProtectedResourceMetadataBuilder(mcpServerUrl(), [
    `https://${domain}/`,
  ])
    .withJwksUri(`https://${domain}/.well-known/jwks.json`)
    .withResourceName("Anna's Dog Grooming MCP")
    .withScopesSupported([...MCP_SCOPES])
    .build();

  return new Response(JSON.stringify(metadata.toJSON()), {
    headers: corsHeaders(),
  });
}

function optionsHandler() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export { handler as GET, optionsHandler as OPTIONS };
