import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid Windows permission issues on a locked .next/trace in this workspace.
  distDir: ".next-build",
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
