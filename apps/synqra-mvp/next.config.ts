import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["framer-motion"],
  },
  reactStrictMode: true,
  // Railway port binding - expose PORT env var
  env: {
    PORT: process.env.PORT,
  },
};

export default nextConfig;
