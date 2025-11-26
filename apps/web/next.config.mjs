import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@itpm/api', '@itpm/db'],
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Enable instrumentation hook for database initialization
  experimental: {
    instrumentationHook: true,
    typedRoutes: true,
    // Disable worker threads that may conflict with Prisma
    workerThreads: false,
    cpus: 1,
  },
  // Configure webpack to handle Prisma properly
  webpack: (config, { isServer }) => {
    // Prisma Client 只需要在 server-side (Node.js) runtime 中標記為 external
    // Edge runtime 不使用 Prisma（由 auth.config.ts 處理）
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

export default withNextIntl(nextConfig);
