import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: false, // Disable PPR for this app
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ]
  }
};

export default nextConfig;
