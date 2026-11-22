import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { RegisterSW } from "@/components/RegisterSW";

const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik", display: "swap" });

export const metadata: Metadata = {
  title: "קהילה מחוברת",
  description: "מוצאים את האנשים הנכונים בקהילה שלכם – עזרה הדדית, המלצות וחיבורים",
  manifest: "/manifest.webmanifest",
  // Profiles must never be indexed by external search engines (PRD §4).
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  appleWebApp: { capable: true, title: "קהילה מחוברת", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#141413" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="min-h-dvh antialiased">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="7" cy="8" r="3" />
                  <circle cx="17" cy="8" r="3" />
                  <path d="M3 19c0-2.8 1.8-5 4-5s4 2.2 4 5M13 19c0-2.8 1.8-5 4-5s4 2.2 4 5" />
                </svg>
              </span>
              <span>קהילה מחוברת</span>
            </Link>
            {user ? (
              <Link href="/profile" className="flex items-center gap-2 text-sm text-ink-2" aria-label="הפרופיל שלי">
                <span className="hidden sm:inline">{user.name || "הפרופיל שלי"}</span>
                <Avatar name={user.name} photo={user.photo} size={32} />
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-medium text-brand">
                התחברות
              </Link>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 pb-24 pt-5">{children}</main>
        <RegisterSW />
      </body>
    </html>
  );
}
