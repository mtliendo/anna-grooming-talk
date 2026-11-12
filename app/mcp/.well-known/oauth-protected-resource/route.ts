/**
 * Compatibility alias: mcp-handler builds resource_metadata as
 * `{mcpServerUrl}/.well-known/oauth-protected-resource` when `resourceUrl`
 * is the MCP identifier. RFC 9728 lives under `/.well-known/...`; this path
 * must still 200 so 401 discovery does not 404.
 */
import {
  protectedResourceOptions,
  protectedResourceResponse,
} from "@/lib/mcp/protected-resource";

export const dynamic = "force-dynamic";

export { protectedResourceResponse as GET, protectedResourceOptions as OPTIONS };
