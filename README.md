# Cronotype

A diagnosis for your commit habits. One field. One verdict. One screenshot.

## Stack

- Next.js 16 (App Router, Cache Components, React Compiler)
- React 19
- Tailwind CSS v4
- GitHub public events API (no auth required, optional `GITHUB_TOKEN` for higher rate limits)

## Run

```bash
pnpm install
cp .env.example .env.local   # optional, but recommended
pnpm dev
```

Then open <http://localhost:3000> and type a GitHub handle.

## Architecture

```
app/
  page.tsx              # Landing — UsernameForm + recently diagnosed
  u/[login]/page.tsx    # The verdict + waveform + evolution strip
  leaderboard/page.tsx  # Most nocturnal, dawn patrol, most 9-to-5, weekend offenders
  about/page.tsx        # How it works
components/
  hero-card.tsx         # The share artifact
  waveform.tsx          # 24-bar linear chart
  radial-chip.tsx       # Mini polar chart for chips/lists
  evolution-strip.tsx   # Year-over-year cronotype change
features/
  profile/              # GitHub fetching, classification, compute pipeline
  leaderboard/          # In-memory store + rankings
lib/
  archetypes.ts         # Vampire / Sunrise Sniper / Lunch Bandit / ...
  stats.ts              # Hour-bucket histogram + bimodality detection
  synthetic.ts          # Seed data for the evolution strip & leaderboard
types/
  cronotype.ts
```

## What ships in v1

- 90-day window only
- In-memory leaderboard (resets on deploy)
- Synthesized year-over-year evolution strip

## Roadmap

- Multi-year history via GraphQL `committedDate` (proper per-commit timezone)
- Persistent leaderboard storage
- OG image generation for share previews
