import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["framer-motion"],
  },
  reactStrictMode: true,
  // Skip static generation to avoid styled-jsx + React 18 issue
  skipTrailingSlashRedirect: true,
  compress: false,
};

export default nextConfig;
