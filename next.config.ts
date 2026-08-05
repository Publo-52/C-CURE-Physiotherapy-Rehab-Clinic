import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['argon2', '@prisma/client', 'prisma'],
  typescript: {
    ignoreBuildErrors: false,
  },
  devIndicators: false,
  compress: true,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', 'framer-motion'],
  },
};

export default nextConfig;
