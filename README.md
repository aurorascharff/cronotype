# Cronotype

**What type of developer are you?**

Type a GitHub handle and get a commit-time archetype, a year-by-year timeline of how it changed, and a shareable profile card.

Live at [cronotype.vercel.app](https://cronotype.vercel.app).

## What it does

Reads public GitHub activity, classifies the last 90 days into one of nine developer rhythms, and draws a year-by-year history chart.

Every generated profile lives at `/:handle`, with share/download images and a [types page](https://cronotype.vercel.app/types) explaining the categories. Team galleries live at `/team?handles=...`, optionally with a `name=...` query parameter for named, shareable galleries.

Private profiles are available at `/private` for signed-in GitHub users. The private flow requests GitHub's classic
`repo` scope, uses it once for read requests, and stores only the derived result.

## Stack

- Next.js 16, React 19, React Compiler, Tailwind CSS v4
- GitHub REST and GraphQL APIs
- Next.js Cache Components and Vercel Runtime Cache
- `next/og` with local Geist fonts

## Architecture

- Cache expensive GitHub reads in the data layer with `use cache: remote`, `cacheTag`, and `cacheLife`
- Cache rendered profile/history output with normal `use cache`
- Use `updateTag` from server actions after regeneration
- Stream GitHub-heavy profile and leaderboard UI behind Suspense
- Keep interactivity in small client leaves

```
app/                  Pages, layouts, OG images
components/theme/     Theme provider and theme toggle
components/ui/        Shared UI primitives and shell helpers
components/           Cronotype-specific shared components
features/profile/     Profile queries/actions and profile-owned components
features/leaderboard/ Leaderboard queries, components, featured handle data
features/team/        Team URL parsing, gallery helpers, and recent-team UI
lib/                  Shared app helpers, archetypes, and formatting
```

## Running it locally

```bash
pnpm install
cp .env.example .env.local
# add a GITHUB_TOKEN for GitHub REST + GraphQL requests
# optionally add GITHUB_HISTORY_TOKEN for history chart requests
pnpm dev
```

Set `MOCK_PROFILE=1` to skip GitHub entirely while working on UI.

For private profiles, set `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET`. Use callback URL `/api/github/private/callback`.
