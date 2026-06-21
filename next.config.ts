import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse bundles pdfjs-dist's worker as a separate file the bundler can't resolve
  // unless these stay external packages, per pdf-parse's own Next.js troubleshooting docs.
  // playwright/stagehand ship native bindings + a browser binary — same reason.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas", "playwright", "@browserbasehq/stagehand"],
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
