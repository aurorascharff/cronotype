# Cronotype

What kind of developer are you? Type a GitHub handle, get a verdict.

```bash
pnpm install
cp .env.example .env.local   # add a GITHUB_TOKEN
pnpm dev
```

A `GITHUB_TOKEN` is required — the Search Commits API doesn't work unauthenticated. Any classic PAT with no scopes is fine.

Built with Next.js 16 (Cache Components, React Compiler) and Tailwind v4. Inspired by [Are You Going Exponential](https://areyougoingexponential.com).
