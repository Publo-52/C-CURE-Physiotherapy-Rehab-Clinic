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
    minimumCacheTTL: 86400,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'framer-motion',
    ],
  },
  headers: async () => [
    {
      source: '/:path*{.png,.jpg,.jpeg,.svg,.webp,.avif,.ico,.woff,.woff2}',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};

export default nextConfig;
