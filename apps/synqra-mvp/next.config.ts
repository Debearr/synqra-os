import type { NextConfig } from "next";

const standaloneOutput = process.env.NEXT_STANDALONE === "true";

const nextConfig: NextConfig = {
  ...(standaloneOutput ? { output: "standalone" } : {}),
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  reactStrictMode: true,
  // Skip static generation to avoid styled-jsx + React 18 issue
  skipTrailingSlashRedirect: true,
  compress: false,
};

export default nextConfig;
