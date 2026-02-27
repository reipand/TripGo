import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**', // Izinkan semua path di bawah hostname ini
      },
    ],
  },
  // Allow cross-origin requests during development
  allowedDevOrigins: ['http://192.168.0.133:3000', 'http://localhost:3000'],
};

export default nextConfig;
