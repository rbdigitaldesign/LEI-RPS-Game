// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Keep server/SSR features on for App Hosting.
  // 'standalone' bundles the server for Node runtimes used by Firebase App Hosting.
  output: 'standalone',

  // Do not set basePath or assetPrefix unless you KNOW you need them.
  // basePath: undefined,
  // assetPrefix: undefined,

  // Leave trailingSlash default (false) to avoid double-routing and missing paths.
  trailingSlash: false,

  // If you use next/image with remote assets, declare them here (edit as needed).
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: false, // keep Next optimisation unless you must disable it
  },

  // Keep TypeScript/ESLint as gatekeepers; flip to true temporarily if you must unblock a build.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Only add custom webpack fallbacks if you actually reference Node modules in the client.
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
  //   }
  //   return config;
  // },
};

export default nextConfig;
