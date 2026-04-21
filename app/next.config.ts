import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  // Microsoft Clarity needs `document.styleSheets[i].cssRules` to serialize
  // stylesheets for session replay. Without CORS mode on <link> tags, the
  // browser blocks cssRules access on cross-origin sheets — the side effect
  // is that Clarity recordings play back as HTML-only (no styles). Setting
  // `crossOrigin: 'anonymous'` makes Next emit `crossorigin="anonymous"` on
  // every auto-generated <link> and <script> tag, unlocking stylesheet
  // capture for Clarity (and replay pipelines generally).
  crossOrigin: "anonymous",
  // Catch-all redirects for legacy / external-system URLs that 404.
  //
  // Google Ads crawler was flagging our asset group as "Destination not
  // working" because Merchant Center URLs (generated from older code)
  // point at /producto/* and /productos/* while the actual storefront
  // routes live under /catalogo/*. Meanwhile ad campaigns reference
  // /regalos-corporativos as a landing page that doesn't exist. 301s
  // here make every historical URL resolve so Google, Meta, and humans
  // all land on the right page.
  async redirects() {
    return [
      { source: "/producto/:slug", destination: "/catalogo/:slug", permanent: true },
      { source: "/productos/:slug", destination: "/catalogo/:slug", permanent: true },
      { source: "/productos", destination: "/catalogo", permanent: true },
      { source: "/regalos-corporativos", destination: "/catalogo", permanent: true },
      { source: "/regalos-corporativos/:path*", destination: "/catalogo", permanent: true },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.merkleydetails.com",
      },
      {
        protocol: "https",
        hostname: "merkleydetails.com",
      },
      {
        protocol: "http",
        hostname: "**.merkleydetails.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "acertijo-f1",
  project: "merkley-storefront",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Disable Sentry telemetry
  telemetry: false,
});
