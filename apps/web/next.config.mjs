import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@itpm/api', '@itpm/db'],
  // FIX-109: Security headers for all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
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
