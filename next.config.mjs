/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Turbopack configuration (used with --turbo flag in dev)
  turbopack: {
    resolveAlias: {
      // Ignore the porto package which has incompatible viem chain imports
      // Use empty string to effectively disable/ignore the module
      porto: "",
    },
  },
  // Webpack configuration (used for production builds)
  webpack: (config, { isServer }) => {
    // Ignore the porto package which has incompatible viem chain imports
    config.resolve.alias = {
      ...config.resolve.alias,
      porto: false,
    };

    return config;
  },
};

export default nextConfig;
