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
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth profile pictures
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'huwcvhngslkmfljfnxrv.supabase.co', // Supabase storage
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ['http://192.168.0.133:3000', 'http://localhost:3000'],
};

export default nextConfig;
