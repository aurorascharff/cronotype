# Cronotype

**What type of developer are you?**

Type a GitHub handle and get a commit-time archetype, a year-by-year timeline of how it changed, and a shareable profile card.

Live at [cronotype.vercel.app](https://cronotype.vercel.app).

## What it does

Reads the last 90 days of public commits for a GitHub user and sorts them into one of eight rhythms (Vampire, Sunrise Sniper, Nine-to-Fiver, Lunch Bandit, Weekend Warrior, Insomniac Maintainer, Drifter, Grass Toucher). Then draws a multicolor line chart of how the archetype shifted year over year.

Every profile has a dynamic Open Graph image, a leaderboard of well-known developers ranked by GitHub followers, and a [types page](https://cronotype.vercel.app/types) explaining each rhythm and the exact rule that triggers it.

## Stack

- Next.js 16, React 19, React Compiler, Tailwind CSS v4
- GitHub Search Commits API for the 90-day hourly distribution
- GitHub GraphQL contributions calendar for the multi-year history
- `next/og` for the share image, rendered with Geist

## Architecture

- `'use cache'` per query with `cacheTag` and `cacheLife`. Profile, stats, and per-year archetype each cache independently
- `connection()` to gate dynamic work into Suspense boundaries
- `unstable_catchError` from `next/error` for retry-aware error boundaries
- Server components everywhere. Only the form, share buttons, and theme toggle are client

```
app/                  Pages, layouts, OG images
features/profile/     Queries, services, components for a single handle
features/leaderboard/ Recently revealed list
lib/archetypes.ts     Classifier and percentile math
```

## Running it locally

```bash
pnpm install
cp .env.example .env.local
# add a GITHUB_TOKEN with public_repo scope
pnpm dev
```

Set `MOCK_PROFILE=1` to skip GitHub entirely while working on UI.
