import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["framer-motion"],
  },
  reactStrictMode: true,
};

export default nextConfig;
