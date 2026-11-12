import { NextResponse, type NextRequest } from "next/server";
import { getAuth0 } from "@/lib/auth0";
import { isAuth0Configured } from "@/lib/config";

/**
 * Next.js 16 proxy (successor to middleware). Mounts Auth0 v4 routes
 * (/auth/login, /auth/logout, /auth/callback, /auth/profile, /auth/connect).
 * MCP lives at /mcp and authenticates with a Bearer token, not cookies.
 */
export async function proxy(request: NextRequest) {
  if (!isAuth0Configured()) {
    return NextResponse.next();
  }

  const { pathname, origin } = request.nextUrl;

  // MCP and PRM metadata authenticate with Bearer tokens, not the session cookie.
  if (pathname.startsWith("/mcp") || pathname.startsWith("/.well-known")) {
    return NextResponse.next();
  }

  const authRes = await getAuth0().middleware(request);

  if (pathname.startsWith("/auth")) return authRes;
  if (pathname.startsWith("/api")) return authRes;
  if (
    pathname === "/" ||
    pathname === "/connect" ||
    pathname.startsWith("/docs")
  ) {
    return authRes;
  }

  const session = await getAuth0().getSession(request);
  if (!session && (pathname.startsWith("/book") || pathname.startsWith("/chat"))) {
    return NextResponse.redirect(
      `${origin}/auth/login?returnTo=${encodeURIComponent(pathname)}`,
    );
  }

  return authRes;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icon.svg|og.jpg|screenshots/).*)",
  ],
};
