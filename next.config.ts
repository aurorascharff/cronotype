import type { NextConfig } from 'next';

const DAY = 60 * 60 * 24;

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    cronotype: {
      expire: 60 * DAY,
      revalidate: 30 * DAY,
      stale: 60 * DAY,
    },
    profile: {
      expire: 7 * DAY,
      revalidate: DAY,
      stale: DAY,
    },
  },
  experimental: {
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
