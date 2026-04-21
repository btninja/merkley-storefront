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
