/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Ignore the porto package which has incompatible viem chain imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'porto': false,
    };

    return config;
  }
};

export default nextConfig;
