/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@itpm/api', '@itpm/db'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
