/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@itpm/api', '@itpm/db'],
  experimental: {
    typedRoutes: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during build for performance analysis
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors during build for performance analysis
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
