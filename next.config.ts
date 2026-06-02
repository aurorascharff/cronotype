import type { NextConfig } from 'next';

const DAY = 60 * 60 * 24;
const MINUTE = 60;
const YEAR = 365 * DAY;

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    cronotype: {
      expire: YEAR,
      revalidate: 180 * DAY,
      stale: 5 * MINUTE,
    },
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
    cachedNavigations: true,
    inlineCss: true,
    instantInsights: {
      validationLevel: 'warning',
    },
    instantNavigationDevToolsToggle: true,
    useOffline: true,
    viewTransition: true,
  },
  reactCompiler: true,
  typedRoutes: true,
};

export default nextConfig;
