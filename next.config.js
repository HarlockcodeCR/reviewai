/** @type {import('next').NextConfig} */
const nextConfig = {
  // Stripe webhook needs raw body — App Router handles this natively
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
};

module.exports = nextConfig;
