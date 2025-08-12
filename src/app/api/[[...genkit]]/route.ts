/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Required for Firebase App Hosting to run the server bundle
  output: 'standalone',

  // Keep defaults unless you truly need them
  trailingSlash: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'i.imgur.com', pathname: '/**' },
    ],
    unoptimized: false,
  },

  // Prefer NOT to ignore errors; use temporarily only if unblocking a build
  // typescript: { ignoreBuildErrors: true },
  // eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;