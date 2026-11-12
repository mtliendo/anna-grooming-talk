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
          <span className="brand-paw" aria-hidden>
            <PawMark size={26} />
          </span>
          <span className="brand-name">Anna&apos;s Dog Grooming</span>
        </Link>

        <nav className="nav-links" aria-label="Salon">
          <Link className={`nav-link${path === "/" ? " active" : ""}`} href="/">
            Home
          </Link>
          <Link className={`nav-link${path.startsWith("/book") ? " active" : ""}`} href="/book">
            Book
          </Link>
          <Link className={`nav-link${path.startsWith("/chat") ? " active" : ""}`} href="/chat">
            Message
          </Link>
        </nav>

        <div className="auth-cluster">
          {!configured ? (
            <span className="badge">Setup needed</span>
          ) : user ? (
            <>
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="avatar"
                  src={user.picture}
                  alt={user.name ?? "Signed-in customer"}
                />
              ) : (
                <span className="avatar" aria-hidden />
              )}
              <span className="user-meta">
                <span className="user-email">{user.email ?? user.name}</span>
              </span>
              <a className="btn btn-text btn-small" href="/auth/logout">
                Sign out
              </a>
            </>
          ) : (
            <>
              <a className="btn btn-text btn-small" href="/auth/login?returnTo=/book">
                Sign in
              </a>
              <a className="btn btn-primary btn-small" href="/book">
                Book
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
