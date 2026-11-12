import { ApiClient, VerifyAccessTokenError } from "@auth0/auth0-api-js";
import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, type ZodRawShape } from "zod";
import { auth0Domain, mcpServerUrl } from "@/lib/config";

type InferShape<T extends ZodRawShape> = {
  [K in keyof T]: z.infer<T[K]>;
};

export type McpAuth = AuthInfo & {
  extra: {
    sub: string;
    email?: string;
    name?: string;
  };
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function verifyMcpToken(token: string): Promise<McpAuth> {
  const apiClient = new ApiClient({
    domain: auth0Domain(),
    audience: mcpServerUrl(),
  });

  try {
    const decoded = await apiClient.verifyAccessToken({ accessToken: token });
    if (!isNonEmptyString(decoded.sub)) {
      throw new InvalidTokenError("Token is missing 'sub' claim");
    }

    let clientId: string | null = null;
    if (isNonEmptyString(decoded.client_id)) clientId = decoded.client_id;
    else if (isNonEmptyString(decoded.azp)) clientId = decoded.azp;
    if (!clientId) {
      throw new InvalidTokenError("Token is missing 'client_id' or 'azp' claim");
    }

    return {
      token,
      clientId,
      scopes:
        typeof decoded.scope === "string"
          ? decoded.scope.split(" ").filter(Boolean)
          : [],
      ...(decoded.exp && { expiresAt: decoded.exp }),
      extra: {
        sub: decoded.sub,
        ...(isNonEmptyString(decoded.name) && { name: decoded.name }),
        ...(isNonEmptyString(decoded.email) && { email: decoded.email }),
      },
    };
  } catch (error) {
    if (error instanceof VerifyAccessTokenError) {
      throw new InvalidTokenError(error.message);
    }
    throw error;
  }
}

export function requireScopes<T extends ZodRawShape>(
  requiredScopes: readonly string[],
  handler: (
    args: InferShape<T>,
    extra: { authInfo: McpAuth },
  ) => Promise<CallToolResult>,
): ToolCallback<T> {
  return (async (args, extra) => {
    let context = extra;
    if (!extra) context = args as Parameters<ToolCallback<T>>[1];
    if (!context.authInfo) {
      throw new Error("Authentication is required to execute this tool");
    }
    const userScopes = context.authInfo.scopes ?? [];
    const hasScopes = requiredScopes.every((scope) => userScopes.includes(scope));
    if (!hasScopes) {
      throw new Error(`Missing required scopes: ${requiredScopes.join(", ")}`);
    }
    return handler(args as InferShape<T>, {
      authInfo: context.authInfo as McpAuth,
    });
  }) as ToolCallback<T>;
}
