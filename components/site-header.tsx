"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PawMark } from "@/components/icons";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  sub?: string | null;
};

export function SiteHeader({
  user,
  configured,
}: {
  user?: HeaderUser | null;
  configured: boolean;
}) {
  const path = usePathname() ?? "/";
  return (
    <header className="site-header">
      <div className="shell nav">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <PawMark size={20} />
          </span>
          <span className="brand-copy">
            <span className="brand-kicker">Trust, but Verify</span>
            <span className="brand-name">Anna&apos;s Dog Grooming</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Talk demo">
          <Link className={`nav-link${path === "/" ? " active" : ""}`} href="/">
            Home
          </Link>
          <Link className={`nav-link${path.startsWith("/book") ? " active" : ""}`} href="/book">
            Book
          </Link>
          <Link className={`nav-link${path.startsWith("/chat") ? " active" : ""}`} href="/chat">
            Chat
          </Link>
          <Link className={`nav-link${path.startsWith("/connect") ? " active" : ""}`} href="/connect">
            MCP
          </Link>
        </nav>

        <div className="auth-cluster">
          {!configured ? (
            <span className="badge">Setup needed</span>
          ) : user ? (
            <>
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="avatar" src={user.picture} alt={user.name ?? "Signed-in customer"} />
              ) : (
                <span className="avatar" />
              )}
              <span className="user-meta">
                <span className="user-email">{user.email ?? user.name}</span>
                {user.sub ? <span className="sub-chip">{user.sub}</span> : null}
              </span>
              <a className="btn btn-ghost btn-small" href="/auth/logout">
                Sign out
              </a>
            </>
          ) : (
            <>
              <a className="btn btn-ghost btn-small" href="/auth/login?returnTo=/book">
                Sign in
              </a>
              <a
                className="btn btn-primary btn-small"
                href="/auth/login?screen_hint=signup&returnTo=/book"
              >
                Sign up
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
