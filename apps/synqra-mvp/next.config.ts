import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  reactStrictMode: true,
  // Skip static generation to avoid styled-jsx + React 18 issue
  skipTrailingSlashRedirect: true,
  compress: false,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
