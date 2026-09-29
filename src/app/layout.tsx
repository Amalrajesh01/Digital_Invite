import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { brand } from "@/lib/brand";
import "./globals.css";

const ui = Geist({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${brand.name} — premium digital wedding invitations`, template: `%s · ${brand.name}` },
  description: "Invite. Experience. Remember. Premium digital wedding invitations with RSVP, guest management and lifelong memories.",
  applicationName: brand.name,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#f7f3ec", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${display.variable}`} suppressHydrationWarning>
      <body>
        {/* Marks the document as script-enabled before first paint so scroll-reveal never hides content without JS. */}
        <Script id="js-flag" strategy="beforeInteractive">{"document.documentElement.classList.add('js')"}</Script>
        {children}
        <Toaster position="bottom-center" toastOptions={{ style: { fontFamily: "var(--font-ui)", borderRadius: "6px", border: "1px solid var(--rule-strong)", background: "var(--surface)", color: "var(--ink)" } }} />
      </body>
    </html>
  );
}
