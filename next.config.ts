import type { NextConfig } from 'next';

const DAY = 60 * 60 * 24;
const YEAR = 365 * DAY;

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    cronotype: {
      expire: YEAR,
      revalidate: 90 * DAY,
      stale: 90 * DAY,
    },
  },
  experimental: {
    cachedNavigations: true,
    inlineCss: true,
    viewTransition: true,
    instantInsights: {
      validationLevel: 'warning',
    },
    instantNavigationDevToolsToggle: true,
    useOffline: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatars.githubusercontent.com',
        protocol: 'https',
      },
    ],
  },
  reactCompiler: true,
  typedRoutes: true,
};

export default nextConfig;
