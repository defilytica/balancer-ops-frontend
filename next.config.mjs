/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      // Ignore the porto package which has incompatible viem chain imports
      porto: "",
    },
  },
};

export default nextConfig;
