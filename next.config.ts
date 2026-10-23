import type { NextConfig } from "next";
import { SLUG_HEADER } from "./src/lib/hosts";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** The public template previews: never indexed, trained on, archived, cached or framed by another site. */
const previewHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageai, noai" },
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR lets a second copy of the app (a QA server next to a running dev server) keep its own build output
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  // PGlite (embedded Postgres for zero-setup development) and sharp are native/wasm packages.
  serverExternalPackages: ["@electric-sql/pglite", "sharp", "postgres", "pdfkit", "nodemailer"],
  // /stock/<id> reads its photograph by a computed name, which file tracing cannot see: ship them with that route on serverless hosts
  outputFileTracingIncludes: {
    "/stock/*": ["./assets/stock/*.jpg"],
    // the daily report PDF reads its fonts and logo from disk: the cron, the download and the "Send now" action (a Studio tab)
    "/api/cron/reports": ["./assets/fonts/*.ttf", "./public/brand/logo-on-light.png"],
    "/api/reports/[weddingId]": ["./assets/fonts/*.ttf", "./public/brand/logo-on-light.png"],
    "/admin/weddings/[id]/[section]": ["./assets/fonts/*.ttf", "./public/brand/logo-on-light.png"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  // A wedding's own address (see src/proxy.ts): the proxy validates the host and sets SLUG_HEADER; these rewrites are what move the
  // request to the invitation. Nothing else sets that header (the proxy strips it from every inbound request).
  async rewrites() {
    const has = [{ type: "header" as const, key: SLUG_HEADER, value: "(?<slug>[a-z0-9]+(?:-[a-z0-9]+)*)" }];
    return {
      beforeFiles: [
        { source: "/", has, destination: "/invite/:slug" },
        { source: "/:token([A-Za-z0-9_-]+)", has, destination: "/invite/:slug/:token" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/preview/:path*", headers: previewHeaders },
      // a gift's maker pages and preview: private, never indexed, never cached, never shown inside another site
      { source: "/for-my-love/preview/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }, { key: "Cache-Control", value: "private, no-store" }, { key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/for-my-love/gift/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }, { key: "Cache-Control", value: "private, no-store" }, { key: "Referrer-Policy", value: "no-referrer" }] },
      // the public demonstration of a Forever Letter is for playing, not for search results
      { source: "/for-my-love/letter-demo/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }, { key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/for-my-love/make", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

export default nextConfig;
