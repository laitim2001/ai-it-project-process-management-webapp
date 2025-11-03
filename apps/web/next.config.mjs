import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
  webpack: (config, { isServer, nextRuntime }) => {
    // Prisma Client 需要在所有 server-side 和 middleware contexts 中標記為 external
    // 這包括：Node.js runtime (isServer=true) 和 Edge runtime (nextRuntime='edge')
    if (isServer || nextRuntime === 'edge' || nextRuntime === 'nodejs') {
      config.externals.push('@prisma/client');
      config.externals.push('@itpm/db');
      config.externals.push('bcryptjs');
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
