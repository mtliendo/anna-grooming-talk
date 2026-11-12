import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyMcpToken } from "@/lib/mcp/auth";
import { registerSalonTools } from "@/lib/mcp/tools";
import { corsHeaders } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const initializeServer = (server: McpServer) => {
  registerSalonTools(server);
};

const handler = createMcpHandler(
  initializeServer,
  {
    serverInfo: {
      name: "anna-dog-grooming",
      version: "1.0.0",
    },
  },
  {
    disableSse: true,
    verboseLogs: true,
    maxDuration: 60,
  },
);

const authHandler = withMcpAuth(
  handler,
  async (_req, token) => {
    if (!token) return;
    return verifyMcpToken(token);
  },
  {
    required: true,
    // RFC 9728 inserts well-known between host and the /mcp path.
    // Do not pass resourceUrl: mcpServerUrl() — withMcpAuth treats that as
    // an origin and emits /mcp/.well-known/... (we still serve that alias).
    resourceMetadataPath: "/.well-known/oauth-protected-resource/mcp",
  },
);

export { authHandler as GET, authHandler as POST, authHandler as DELETE };

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
