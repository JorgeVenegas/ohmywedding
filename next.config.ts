import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow subdomain requests in development
  allowedDevOrigins: [
    'http://ohmy.local:3000',
    'http://jorgeandyuli.ohmy.local:3000',
    'http://jorge-yuls-4.ohmy.local:3000',
    'http://demo-luxury-noir.ohmy.local:3000',
    'http://demo-modern-minimal.ohmy.local:3000',
    'http://demo-romantic-garden.ohmy.local:3000',
    'http://demo-classic-elegance.ohmy.local:3000',
    'http://demo-rustic-charm.ohmy.local:3000',
    'http://demo-simple-love.ohmy.local:3000',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'gfdfltmygqaypdmoywve.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
      }
    ],
    // Allow private IPs for local development
    dangerouslyAllowSVG: true,
    // This is needed for local Supabase development
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
