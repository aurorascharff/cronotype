# Cronotype

**What type of developer are you?**

Type a GitHub handle and get a commit-time archetype, a year-by-year timeline of how it changed, and a shareable profile card.

Live at [cronotype.vercel.app](https://cronotype.vercel.app).

## What it does

Reads public GitHub activity, classifies the last 90 days into one of eight developer rhythms, and draws a year-by-year history chart.

Every generated profile lives at `/:handle`, with share/download images and a [types page](https://cronotype.vercel.app/types) explaining the categories.

## Stack

- Next.js 16, React 19, React Compiler, Tailwind CSS v4
- GitHub REST and GraphQL APIs
- Next.js Cache Components and Vercel Runtime Cache
- `next/og` with local Geist fonts
- Upstash Redis for reveal state

## Architecture

- Cache expensive GitHub reads with `use cache: remote`, `cacheTag`, and `cacheLife`
- Use `updateTag` from server actions after reveal, regeneration, and timeline refreshes
- Stream GitHub-heavy profile and leaderboard UI behind Suspense
- Keep interactivity in small client leaves

```
app/                  Pages, layouts, OG images
features/profile/     Queries, actions, components for a single handle
features/leaderboard/ Recently revealed grid
lib/                  Archetypes, reveal log, stats, timeline helpers
```

## Running it locally

```bash
pnpm install
cp .env.example .env.local
# add a GITHUB_TOKEN for GitHub REST + GraphQL requests
pnpm dev
```

Set `MOCK_PROFILE=1` to skip GitHub entirely while working on UI.

The reveal registry is optional locally. Without `KV_REST_API_URL` and `KV_REST_API_TOKEN`, handles behave as unrevealed and the recently revealed feed is empty.
