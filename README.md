# Cronotype

A Next.js 16 app that classifies a GitHub user's commit rhythm into one of eight archetypes based on the hourly distribution of their recent public commits.

Live at [cronotype.vercel.app](https://cronotype.vercel.app).

## Stack

- Next.js 16 with `cacheComponents`, React 19, React Compiler enabled
- Tailwind CSS v4 with CSS custom properties as design tokens
- GitHub Search Commits API for the 90-day hourly distribution
- GitHub GraphQL contributions calendar for the multi-year history
- `next/og` for the share image, rendered with Geist from `public/fonts`

## Patterns it shows

- `'use cache'` per query with `cacheTag` and `cacheLife`. Profile, stats, and per-year archetype each cache independently
- `connection()` to gate dynamic work (current time, fresh API calls) into Suspense boundaries so the rest of the page can prerender
- `unstable_catchError` from `next/error` for retry-aware error boundaries that handle `notFound()` and `redirect()` correctly
- React Server Components everywhere. Only the form, the share buttons, and the theme toggle are client components
- Per-route OG images via `opengraph-image.tsx`, with `generateMetadata` per profile

## Project structure

```
app/                  Pages, layouts, OG images
features/
  profile/            Queries, services, components for a single handle
  leaderboard/        Recently diagnosed list
components/           Shared UI
lib/
  archetypes.ts       The classifier and percentile math
  github.ts           Auth and shared fetch helpers
```

## Running it locally

```bash
pnpm install
cp .env.example .env.local
# add a GITHUB_TOKEN with public_repo scope
pnpm dev
```

Set `MOCK_PROFILE=1` to skip GitHub entirely while working on UI.

---

By [Aurora Scharff](https://github.com/aurorascharff).
