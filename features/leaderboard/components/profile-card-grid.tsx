import Link from 'next/link';
import { RadialChip } from '@/components/radial-chip';
import { getCardEntry, type LeaderboardEntry } from '@/features/leaderboard/leaderboard-queries';
import { formatFollowers } from '@/lib/format';

/**
 * Server component that fetches a single card's data and renders it.
 * Wrap in `<Suspense fallback={<ProfileCardSkeleton />}>` from the caller.
 *
 * Each instance pulls from `computeCronotype(login)` which is cached per-login,
 * so rendering this 16 times on the homepage fans out to 16 independent cache
 * lookups. Navigating to /u/<login> shares the same cache entry.
 */
export async function ProfileCardSlot({ login }: { login: string }) {
  const entry = await getCardEntry(login);
  if (!entry) return <ProfileCardError login={login} />;
  return <ProfileCard entry={entry} />;
}

export function ProfileCard({ entry }: { entry: LeaderboardEntry }) {
  const { profile, archetype, stats } = entry;
  return (
    <div className="dark:bg-ink-2 group relative h-full rounded-xl border border-black/10 bg-white transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30">
      <Link href={{ pathname: `/u/${profile.login}` }} className="flex h-full flex-col gap-4 p-4">
        <div className="relative flex h-28 items-center justify-center">
          <RadialChip stats={stats} color={archetype.theme.accent} size={112} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatarUrl}
            alt=""
            width={48}
            height={48}
            className="absolute h-12 w-12 rounded-full border border-black/10 dark:border-white/10"
          />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="text-ink dark:text-paper truncate text-sm font-semibold">{profile.name ?? profile.login}</div>
          <div className="text-muted dark:text-muted-dark truncate text-xs">@{profile.login}</div>
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-xs font-medium" style={{ color: archetype.theme.accent }}>
              {archetype.name}
            </div>
            <div className="text-muted dark:text-muted-dark shrink-0 text-[10.5px] tabular-nums">
              {formatFollowers(profile.followers)}
            </div>
          </div>
        </div>
      </Link>
      <a
        href={`https://github.com/${profile.login}`}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`Open ${profile.login} on GitHub`}
        className="text-muted/70 dark:text-muted-dark/70 hover:text-ink dark:hover:text-paper absolute top-2 right-2 rounded-md p-1.5 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.05.78 2.12v3.14c0 .31.21.66.79.55 4.57-1.52 7.86-5.83 7.86-10.91C23.5 5.65 18.35.5 12 .5z" />
        </svg>
      </a>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div
      className="dark:bg-ink-2 flex h-full flex-col items-center gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10"
      aria-hidden
    >
      <div className="flex h-28 items-center justify-center">
        <div className="skeleton h-24 w-24 rounded-full" />
      </div>
      <div className="flex w-full flex-col items-center gap-1.5">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-2 w-16" />
        <div className="skeleton h-2.5 w-20" />
      </div>
    </div>
  );
}

function ProfileCardError({ login }: { login: string }) {
  return (
    <div className="dark:bg-ink-2 text-muted dark:text-muted-dark flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/10 bg-white p-4 text-center text-xs dark:border-white/10">
      <span className="font-mono text-[11px]">@{login}</span>
      <span className="text-[10.5px]">Couldn&apos;t load right now</span>
    </div>
  );
}
