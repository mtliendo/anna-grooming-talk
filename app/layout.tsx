import type { Metadata } from "next";
import { Fraunces, Fredoka, JetBrains_Mono, Nunito } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getSessionSafe } from "@/lib/auth0";
import { APP_BASE_URL, isAuth0Configured } from "@/lib/config";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
});

const bubble = Fredoka({
  subsets: ["latin"],
  variable: "--font-bubble",
  display: "swap",
});

const sans = Nunito({
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
  title: "Anna's Dog Grooming",
  description:
    "Neighborhood baths, trims, and full grooms. Book a visit — one dog at a time.",
  openGraph: {
    title: "Anna's Dog Grooming",
    description:
      "Baths, trims, and full grooms for dogs who come in muddy and leave looking like themselves.",
    images: ["/dogs/mabel.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/dogs/mabel.jpg"],
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
      <body
        className={`${display.variable} ${bubble.variable} ${sans.variable} ${mono.variable}`}
      >
        <SiteHeader user={session?.user} configured={configured} />
        <main>{children}</main>
        <footer className="footer">
          <div className="shell footer-row">
            <span>Anna&apos;s Dog Grooming</span>
            <span>Tue–Sat · 9–5 · by appointment</span>
            <a className="footer-mcp" href="/connect">
              MCP
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}

