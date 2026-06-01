# Cronotype

**What type of developer are you?**

Type a GitHub handle and get a commit-time archetype, a year-by-year timeline of how it changed, and a shareable profile card.

Live at [cronotype.vercel.app](https://cronotype.vercel.app).

## What it does

Reads the last 90 days of public commits for a GitHub user and sorts them into one of eight rhythms (Vampire, Sunrise Sniper, Nine-to-Fiver, Lunch Bandit, Weekend Warrior, Insomniac Maintainer, Drifter, Grass Toucher). Then draws a multicolor line chart of how the archetype shifted year over year.

Every profile has a dynamic Open Graph image, a "Recently revealed" feed of people who've used the site (with a seed list for first-load), and a [types page](https://cronotype.vercel.app/types) explaining each rhythm and the exact rule that triggers it.

## Stack

- Next.js 16, React 19, React Compiler, Tailwind CSS v4
- GitHub Search Commits API for the 90-day hourly distribution
- GitHub GraphQL contributions calendar for the multi-year history
- `next/og` for the share image, rendered with Geist
- Upstash Redis (via Vercel KV) for the recently-revealed feed

## Architecture

- Next.js 16 Cache Components with per-query `cacheTag` and `cacheLife`
- Per-card Suspense in the grid, fetched in stages so one rate limit doesn't blank a card
- `updateTag` action for partial refresh, `after()` for non-blocking writes to KV
- Server components everywhere except the form, share buttons, and theme toggle

```
app/                  Pages, layouts, OG images
features/profile/     Queries, actions, components for a single handle
features/leaderboard/ Recently revealed grid
lib/                  Archetypes, KV reveal log, formatters
```

## Running it locally

```bash
pnpm install
cp .env.example .env.local
# add a GITHUB_TOKEN with public_repo scope
pnpm dev
```

Set `MOCK_PROFILE=1` to skip GitHub entirely while working on UI.

The "Recently revealed" feed is optional locally — without `KV_REST_API_URL` + `KV_REST_API_TOKEN`, it falls back to a hardcoded seed list. To enable live reveals, provision a KV store in the Vercel dashboard and `vercel env pull` the credentials.
