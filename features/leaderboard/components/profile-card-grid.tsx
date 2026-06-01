import { Suspense } from 'react';
import Link from 'next/link';
import { RadialChip } from '@/components/radial-chip';
import { getCardClassification, getCardProfile } from '@/features/leaderboard/leaderboard-queries';
import { formatFollowers } from '@/lib/format';

/**
 * Server component for a single card. Renders progressively:
 *
 *   1. Avatar + handle: deterministic, no fetch (GitHub serves an avatar at
 *      `https://github.com/{login}.png` for any valid login).
 *   2. Profile (name + followers): cheap GET /users/:login, cached 60 days.
 *   3. Archetype + radial chip: Search Commits API, cached 60 days.
 *
 * Each stage has its own Suspense boundary so a rate-limit on one doesn't
 * blank out the others. Once any data is cached, it survives subsequent
 * rate-limited refreshes - the cache layer keeps serving it.
 */
export function ProfileCardSlot({ login }: { login: string }) {
  const avatarUrl = `https://github.com/${login}.png?size=96`;
  return (
    <div className="dark:bg-ink-2 group relative h-full rounded-xl border border-black/10 bg-white transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30">
      <Link href={{ pathname: `/u/${login}` }} className="flex h-full flex-col gap-4 p-4">
        <div className="relative flex h-28 items-center justify-center">
          <Suspense fallback={<RadialChipPlaceholder />}>
            <CardChip login={login} />
          </Suspense>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt=""
            width={48}
            height={48}
            className="absolute h-12 w-12 rounded-full border border-black/10 dark:border-white/10"
          />
        </div>
        <Suspense fallback={<CardMetaSkeleton login={login} />}>
          <CardMeta login={login} />
        </Suspense>
      </Link>
      <a
        href={`https://github.com/${login}`}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`Open ${login} on GitHub`}
        className="text-muted/70 dark:text-muted-dark/70 hover:text-ink dark:hover:text-paper absolute top-2 right-2 rounded-md p-1.5 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.05.78 2.12v3.14c0 .31.21.66.79.55 4.57-1.52 7.86-5.83 7.86-10.91C23.5 5.65 18.35.5 12 .5z" />
        </svg>
      </a>
    </div>
  );
}

async function CardChip({ login }: { login: string }) {
  const result = await getCardClassification(login);
  if (!result) return <RadialChipPlaceholder />;
  return <RadialChip stats={result.stats} color={result.archetype.theme.accent} size={112} />;
}

async function CardMeta({ login }: { login: string }) {
  const [profile, classification] = await Promise.all([getCardProfile(login), getCardClassification(login)]);
  if (!profile) return <CardMetaFallback login={login} />;
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-ink dark:text-paper truncate text-sm font-semibold">{profile.name ?? profile.login}</div>
      <div className="text-muted dark:text-muted-dark truncate text-xs">@{profile.login}</div>
      <div className="flex items-center justify-between gap-2">
        {classification ? (
          <div className="truncate text-xs font-medium" style={{ color: classification.archetype.theme.accent }}>
            {classification.archetype.name}
          </div>
        ) : (
          <div className="text-muted/60 dark:text-muted-dark/60 truncate text-xs">Classifying…</div>
        )}
        <div className="text-muted dark:text-muted-dark shrink-0 text-[10.5px] tabular-nums">
          {formatFollowers(profile.followers)}
        </div>
      </div>
    </div>
  );
}

function RadialChipPlaceholder() {
  return <div className="bg-muted/8 dark:bg-muted-dark/8 absolute inset-2 rounded-full" aria-hidden />;
}

function CardMetaSkeleton({ login }: { login: string }) {
  // Mirrors the resolved `CardMeta` layout exactly: same outer container,
  // same row count, same row heights, same alignment. The handle line uses
  // real text so the typography metrics match across the swap.
  return (
    <div className="min-w-0 space-y-1">
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="text-muted dark:text-muted-dark truncate text-xs">@{login}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-3 w-10 shrink-0 rounded" />
      </div>
    </div>
  );
}

function CardMetaFallback({ login }: { login: string }) {
  // Same 3-row shape as the resolved card so the failure mode doesn't shift either.
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-ink dark:text-paper truncate text-sm font-semibold">@{login}</div>
      <div className="text-muted/60 dark:text-muted-dark/60 truncate text-xs">Couldn&apos;t load profile</div>
      <div className="h-4" />
    </div>
  );
}

export function ProfileCardSkeleton() {
  // Identical to the resolved ProfileCardSlot layout: same padding, gap,
  // chip area height, and meta-block shape. Only difference: skeleton tiles
  // instead of text/chip content. Eliminates any visible shift on Suspense reveal.
  return (
    <div
      className="dark:bg-ink-2 relative h-full rounded-xl border border-black/10 bg-white dark:border-white/10"
      aria-hidden
    >
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="relative flex h-28 items-center justify-center">
          <div className="bg-muted/8 dark:bg-muted-dark/8 absolute inset-2 rounded-full" />
          <div className="skeleton h-12 w-12 rounded-full" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="flex items-center justify-between gap-2">
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-3 w-10 shrink-0 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
