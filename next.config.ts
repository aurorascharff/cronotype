import type { NextConfig } from 'next';

const DAY = 60 * 60 * 24;

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheHandlers: {
    remote: require.resolve('./cache-handlers/upstash-remote.cjs'),
  },
  cacheLife: {
    cronotype: {
      expire: 60 * DAY,
      revalidate: 30 * DAY,
      stale: 60 * DAY,
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
