# Cronotype

What type of developer are you? Type a GitHub handle, get your commit-time archetype.

This is a [Next.js](https://nextjs.org) project.

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

- `GITHUB_TOKEN` (required): used for GitHub Search Commits API requests.
- `NEXT_PUBLIC_BASE_URL` (optional): public app URL for share + OG metadata.
- `MOCK_PROFILE=1` (optional): bypass live GitHub calls for local UI work.

## App

- Profile route: `/u/[login]`
- Dynamic OG route: `/u/[login]/opengraph-image`
- Commit-time archetype classification
- Historical timeline + recent diagnosed rail

## Notes

- Caching uses cache components + tags/lifetimes.
- Heavy profile/history functions use remote cache mode.

## Learn More

[Next.js Documentation](https://nextjs.org/docs)

## Deploy

[Vercel Platform](https://vercel.com/new)
