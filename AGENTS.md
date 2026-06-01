<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Follow the [Next.js App Architecture](.agents/skills/nextjs-app-architecture/SKILL.md) skill for all architectural decisions.

## Repo conventions

- Next.js 16.3 canary, `cacheComponents: true`, React Compiler enabled
- Tailwind CSS v4 with CSS custom properties as design tokens
- React 19 with `ViewTransition` for streaming reveals; toggled via `experimental.viewTransition` in [next.config.ts](next.config.ts)
- Feature folders: `features/profile/`, `features/leaderboard/`
- Domain verb "reveal" is the app's term for classifying a handle; don't reintroduce "diagnose"
- All pages export `unstable_prefetch = 'force-runtime'`
- All public queries are wrapped in React `cache()` for in-request dedupe and `'use cache'` for cross-request caching
- Components that fetch live data (`<CronotypeProfile>`, `<EvolutionStrip>`, `<RecentRevealed>`) call `await connection()` so they don't run at prerender
- Theme: light/dark via `next-themes`; client components use `useSyncExternalStore` (not `useEffect + setMounted`) to read "mounted" state without lint errors
- Section headers (`<h2>` titles) live in `app/**/page.tsx` outside Suspense so they paint in the static shell; feature components return only their grid/card content

## GitHub data sources

- **Search Commits API** for the 90-day hourly distribution. 30 requests/minute limit - the dominant cost. Capped to 1 page (100 commits) per profile in [features/profile/profile-queries.ts](features/profile/profile-queries.ts) to keep budget reasonable.
- **GraphQL contributions calendar** for the multi-year history. 5000/hr pool. One call per year, fanned out serially in [features/profile/profile-queries.ts](features/profile/profile-queries.ts).
- The leaderboard (`getFeaturedEntries`) iterates 18 featured logins serially and caches the aggregate for `cacheLife('hours')`. On a cold cache it consumes ~18 Search Commits requests; subsequent visitors are served from cache.

## Cache discipline

- Don't catch errors inside `'use cache'` functions - `try/catch → return null` pins the failure for the whole cacheLife window. Let errors reject; handle them at the call site with `Promise.allSettled` or an outer try/catch.
- Don't return `[]` from a `'use cache'` function when every item failed; throw instead so the empty result isn't materialized. The outer caller can catch and render an empty state for one render.
- The OG image (`opengraph-image.tsx`) calls `computeCronotype` so it shares the page's cache entry. Never duplicate classify/format logic in the OG route.
- Format helpers (`formatHour`, `formatCount`, `formatFollowers`) live in [lib/format.ts](lib/format.ts) and are shared between the hero card, leaderboard, and OG.

## Prerender hygiene

- `new Date()` outside a `connection()` gate fails the build with "Next.js encountered the unstable value". The leaderboard, profile, and evolution components all gate.
- Don't use `generateStaticParams` on routes that fan out to GitHub - a single rate-limit during build bakes the fallback PNG permanently as a static asset.

## View Transitions

- Use the `<Crossfade>` wrapper in [components/crossfade.tsx](components/crossfade.tsx) for Suspense reveals that benefit from a soft fade (`<CronotypeProfile>`, `<EvolutionStrip>`).
- Don't wrap small, frequently-revalidating components like `<RecentRevealed>` - the crossfade flashes during refreshes. Hard swap is fine there.

## Error boundaries

Use `unstable_catchError` from `next/error`. [components/inline-error-boundary.tsx](components/inline-error-boundary.tsx) exposes a generic boundary that accepts a `title`, `body`, and `retryLabel`. Use it inline around Suspense children that can fail independently (e.g. the evolution chart on a profile page).

## Mocking GitHub for local dev

Set `MOCK_PROFILE=1` in `.env.local`. The mock path in [features/profile/profile-queries.ts](features/profile/profile-queries.ts) returns synthetic stats based on the login string, so every page renders without burning rate-limit budget. Use it for UI work.
