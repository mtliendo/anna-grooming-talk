import { ProtectedResourceMetadataBuilder } from "@auth0/auth0-api-js";
import { MCP_SCOPES, auth0Domain, corsHeaders, mcpServerUrl } from "@/lib/config";

/** RFC 9728 Protected Resource Metadata for the salon MCP resource. */
export function protectedResourceMetadata() {
  const domain = auth0Domain();
  return new ProtectedResourceMetadataBuilder(mcpServerUrl(), [
    `https://${domain}/`,
  ])
    .withJwksUri(`https://${domain}/.well-known/jwks.json`)
    .withResourceName("Anna's Dog Grooming MCP")
    .withScopesSupported([...MCP_SCOPES])
    .build()
    .toJSON();
}

export function protectedResourceResponse() {
  return new Response(JSON.stringify(protectedResourceMetadata()), {
    headers: corsHeaders(),
  });
}

export function protectedResourceOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
