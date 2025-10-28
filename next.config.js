/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Suppress turbopack warnings
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Suppress specific warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Optimize for production
  swcMinify: true,

  // Reduce webpack warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Suppress specific warnings
    config.infrastructureLogging = {
      level: 'error',
    };

    return config;
  },

  // Experimental features
  experimental: {
    // Suppress turbopack.root warning
    turbo: {
      rules: {},
    },
  },
};

export default nextConfig;
