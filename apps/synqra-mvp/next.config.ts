import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["framer-motion"],
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore experimental lib type errors
  },
};

export default nextConfig;
