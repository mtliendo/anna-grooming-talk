import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getSessionSafe } from "@/lib/auth0";
import { APP_BASE_URL, isAuth0Configured } from "@/lib/config";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  title: "Anna's Dog Grooming — Trust, but Verify",
  description:
    "Talk demo: Auth0 login, classic booking, chatbot, Token Vault, MCP, and real CIBA cancellation.",
  openGraph: {
    title: "Anna's Dog Grooming — Trust, but Verify",
    description:
      "Auth0 for AI Agents talk demo by Focus Otter: Token Vault, MCP, and CIBA.",
    images: ["/og.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configured = isAuth0Configured();
  const session = await getSessionSafe();

  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        <SiteHeader user={session?.user} configured={configured} />
        <main className="shell page">{children}</main>
        <footer className="footer">
          <div className="shell footer-row">
            <span>Anna&apos;s Dog Grooming · Trust, but Verify</span>
            <span>Auth0 talk demo by Michael Liendo · @focusotter</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
