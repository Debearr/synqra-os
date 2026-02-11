import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/enter",
        permanent: false, // Use 307 temporary redirect
      },
    ];
  },
  ...(process.env.NEXT_PUBLIC_STANDALONE_OUTPUT === 'true' ? { output: "standalone" } : {}),
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
