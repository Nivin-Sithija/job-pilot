import type { NextConfig } from "next";

// Read at config-eval time (build/start), not request time — NEXT_PUBLIC_INSFORGE_URL is the
// one third-party origin the browser InsForge client (lib/insforge-client.ts) talks to directly.
const insforgeOrigin = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "https://*.insforge.app";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    // script-src/style-src keep 'unsafe-inline' (and script-src 'unsafe-eval' for dev/HMR)
    // since this doesn't use nonce-based CSP yet — tightening that further is a follow-up,
    // not a regression introduced here.
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${insforgeOrigin} https://us.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com`,
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Minimal self-contained server.js + only the node_modules it actually needs — the
  // Docker runtime stage copies just .next/standalone instead of the full node_modules tree.
  output: "standalone",
  // pdf-parse bundles pdfjs-dist's worker as a separate file the bundler can't resolve
  // unless these stay external packages, per pdf-parse's own Next.js troubleshooting docs.
  // playwright/stagehand ship native bindings + a browser binary — same reason.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas", "playwright", "@browserbasehq/stagehand"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
