import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double rendering in development
  reactStrictMode: false,
  // Disable onDemandEntries watching to prevent excessive rebuilds
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 5,
  },
  // Turbopack experimental options for development
  experimental: {
    // Reduce file watching sensitivity
    optimizePackageImports: ["@radix-ui/primitives"],
  },
  // Ensure the serverless-Chromium binary used by the invitation screenshot route
  // is included in its deployed function bundle (it's loaded dynamically at
  // runtime, so Next's dependency trace won't pick it up automatically). Scoped
  // broadly to app/api/** rather than the exact route path since the key format
  // for dynamic-segment routes varies across Next versions.
  outputFileTracingIncludes: {
    "app/api/**/*": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  // Allow subdomain and cross-origin requests in development
  // This prevents HMR issues that can cause page reloads
  // Format: hostnames only (no protocol or port)
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'ohmy.local',
    'messi-antonella.ohmy.local',
    '*.ohmy.local',
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
      // Wedding-uploaded photos (hero/banner/gallery) — bucket policy grants public
      // GetObject on everything except guest-photos/*, and stored URLs never expire,
      // so Next's server-side optimizer can safely fetch and resize these.
      {
        protocol: 'https',
        hostname: 'ohmywedding-assets.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'ohmywedding-assets-dev.s3.us-east-1.amazonaws.com',
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
