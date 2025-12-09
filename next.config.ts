import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '*.replit.dev',
    '*.spock.replit.dev',
    '*.pike.replit.dev',
  ],
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
