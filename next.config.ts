import type { NextConfig } from 'next';

const DAY = 60 * 60 * 24;

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Commit-rhythm data barely changes on human timescales. Profiles, stats,
    // archetypes, and per-year history all stay valid for weeks at minimum.
    // Bias toward serving stale immediately while a background refresh runs.
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
