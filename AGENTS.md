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
- Feature roots should stay readable: keep `<feature>-queries.ts` / `<feature>-actions.ts` at the root, colocate one-owner helper code inside those files, and use named subfolders like `data/` when a feature has static data.
- Theme plumbing lives in `components/theme/`
- Shared UI primitives, button states, UI icons, crossfade, and error boundaries live in `components/ui/`; Cronotype-specific shared components stay in `components/`
- Domain verb "reveal" is the app's term for classifying a handle; don't reintroduce "diagnose"
- Public GitHub data queries use `'use cache: remote'` where durable cross-request caching protects rate limits
- Rendered profile/history wrappers use normal `'use cache'` and sit behind Suspense so the static shell can stream
- Components that intentionally read request-time mutable lists (`<RecentRevealed>`, `<SuggestedUsers>`) call `await connection()`
- Skeletons are co-located with the component they represent. Don't create standalone skeleton-only files.
- Theme: light/dark via `next-themes`; client components use `useSyncExternalStore` (not `useEffect + setMounted`) to read "mounted" state without lint errors
- Section headers (`<h2>` titles) live in `app/**/page.tsx` outside Suspense so they paint in the static shell; feature components return only their grid/card content

## GitHub data sources

- **Search Commits API** for the 90-day hourly distribution. 30 requests/minute limit - the dominant cost. Capped to 1 page (100 commits) per profile in [features/profile/profile-queries.ts](features/profile/profile-queries.ts) to keep budget reasonable.
- **Search Commits API** for yearly archetypes. Every active history year is classified; normal years sample 100 commits, while years above 1000 contributions sample fewer commits so high-volume profiles keep their timeline shape without burning the rate-limit budget.
- **GraphQL contributions calendar** for the multi-year history. 5000/hr pool. One call per year, fanned out serially in [features/profile/profile-queries.ts](features/profile/profile-queries.ts).
- **GitHub OAuth private flow** in [features/profile/profile-private-queries.ts](features/profile/profile-private-queries.ts) requests the classic `repo` scope because GitHub requires it for private repo commit search. The token is used for read requests during the callback and is not stored; only the derived result is kept in the browser.
- The top revealed list only displays featured handles. Reveal state lives in [lib/reveals.ts](lib/reveals.ts), backed by Upstash when configured, and the featured reveal lookups use `cacheLife('cronotype')`.

## Cache discipline

- Don't catch errors inside `'use cache'` functions - `try/catch → return null` pins the failure for the whole cacheLife window. Let errors reject; handle them at the call site with `Promise.allSettled` or an outer try/catch.
- Don't return `[]` from a `'use cache'` function when every item failed; throw instead so the empty result isn't materialized. The outer caller can catch and render an empty state for one render.
- The OG image (`opengraph-image.tsx`) calls `computeCronotype` so it shares the page's cache entry. Never duplicate classify/format logic in the OG route.
- Format helpers (`formatHour`, `formatCount`, `formatFollowers`) live in [lib/format.ts](lib/format.ts) and are shared between the hero card, leaderboard, and OG.

## Prerender hygiene

- `new Date()` inside cached scopes should be isolated behind explicit `cacheLife()` so the cache behavior is clear.
- Don't use `generateStaticParams` on routes that fan out to GitHub - a single rate-limit during build bakes the fallback PNG permanently as a static asset.

## View Transitions

- Use the `<Crossfade>` wrapper in [components/ui/crossfade.tsx](components/ui/crossfade.tsx) for Suspense reveals that benefit from a soft fade (`<CronotypeProfile>`, `<EvolutionStrip>`).
- Don't wrap small, frequently-revalidating components like `<RecentRevealed>` - the crossfade flashes during refreshes. Hard swap is fine there.

## Error boundaries

Use `unstable_catchError` from `next/error`. The reusable boundary primitive lives in [components/ui/error-boundary.tsx](components/ui/error-boundary.tsx); pass the profile or timeline-shaped fallback inline at the call site.

## Mocking GitHub for local dev

Set `MOCK_PROFILE=1` in `.env.local`. The mock path in [features/profile/profile-queries.ts](features/profile/profile-queries.ts) returns synthetic stats based on the login string, so every page renders without burning rate-limit budget. Use it for UI work.
