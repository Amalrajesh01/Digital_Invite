import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { brand } from "@/lib/brand";
import "./globals.css";

/** Inter is the house typeface everywhere — studio, site and invitations (Malayalam etc. use Noto Sans). */
const inter = Inter({ subsets: ["latin"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${brand.name} — premium digital wedding invitations`, template: `%s · ${brand.name}` },
  description: "Invite. Experience. Remember. Premium digital wedding invitations with RSVP, guest management and lifelong memories — by StackBridge Labs.",
  applicationName: brand.name,
  authors: [{ name: brand.company, url: brand.companyUrl }],
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico", apple: "/brand/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#0b1b35", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        {/* Marks the document as script-enabled before first paint so scroll-reveal never hides content without JS. */}
        <Script id="js-flag" strategy="beforeInteractive">{"document.documentElement.classList.add('js')"}</Script>
        {children}
        <Toaster position="bottom-center" toastOptions={{ style: { fontFamily: "var(--font-ui)", borderRadius: "8px", border: "1px solid var(--rule-strong)", background: "var(--surface)", color: "var(--ink)" } }} />
      </body>
    </html>
  );
}
