/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@itpm/api', '@itpm/db'],
  experimental: {
    typedRoutes: true,
    // Disable worker threads that may conflict with Prisma
    workerThreads: false,
    cpus: 1,
  },
  // Configure webpack to handle Prisma properly
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
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
