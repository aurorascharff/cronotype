# Cronotype

What type of developer are you? Type a GitHub handle, get your commit-time archetype.

This is a [Next.js](https://nextjs.org) project.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Cronotype Setup

Cronotype is built on top of the default Next.js app template and adds a GitHub-based archetype diagnosis flow.

### Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

### Required environment variables

- `GITHUB_TOKEN`: required for GitHub Search Commits API requests.

### Optional environment variables

- `NEXT_PUBLIC_BASE_URL`: public app URL used for share and metadata links.
	- Production default in this repo is `https://cronotype.vercel.app` when unset.
- `MOCK_PROFILE=1`: bypass live GitHub calls for local UI work.

### What Cronotype adds

- Profile route: `/u/[login]`
- Dynamic OG image route: `/u/[login]/opengraph-image`
- Commit-time archetype classification
- Historical "How you got here" timeline
- Recently diagnosed profile rail

### Caching notes

- Profile/stat/history query functions use cache components with tags and lifetimes.
- Heavy profile data functions use remote cache mode for better production persistence.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
