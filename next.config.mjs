/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      // Ignore the porto package which has incompatible viem chain imports
      porto: "",
    },
  },
};

export default nextConfig;
