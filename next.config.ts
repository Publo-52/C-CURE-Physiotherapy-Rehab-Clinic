import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['argon2', '@prisma/client', 'prisma'],
  typescript: {
    ignoreBuildErrors: false,
  },
  devIndicators: false,
  outputFileTracingIncludes: {
    "/**/*": ["./prisma/dev.db", "./dev.db"]
  }
};

export default nextConfig;
