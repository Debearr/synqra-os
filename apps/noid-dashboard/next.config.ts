import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configure dev server to listen on all interfaces
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
