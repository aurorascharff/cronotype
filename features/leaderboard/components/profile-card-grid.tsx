import Link from 'next/link';
import { RadialChip } from '@/components/radial-chip';
import type { LeaderboardEntry } from '@/features/leaderboard/leaderboard-queries';

type Props = {
  entries: LeaderboardEntry[];
};

/**
 * Shared profile card. Neutral translucent tile, halo chart up top, verdict
 * + handle below. The only color comes from the chart spokes.
 */
export function ProfileCardGrid({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-black/10 p-8 text-center text-sm dark:border-white/10">
        No one diagnosed yet. Be the first.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map(e => (
        <li key={e.profile.login}>
          <ProfileCard entry={e} />
        </li>
      ))}
    </ul>
  );
}

export function ProfileCard({ entry }: { entry: LeaderboardEntry }) {
  const { profile, archetype, stats } = entry;
  return (
    <Link
      href={{ pathname: `/u/${profile.login}` }}
      className="dark:bg-ink-2 group flex h-full flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
    >
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
        <div className="text-ink dark:text-paper truncate text-sm font-semibold">
          {profile.name ?? profile.login}
        </div>
        <div className="text-muted dark:text-muted-dark truncate text-xs">@{profile.login}</div>
        <div className="truncate text-xs font-medium" style={{ color: archetype.theme.accent }}>
          {archetype.name}
        </div>
      </div>
    </Link>
  );
}

export function ProfileCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="dark:bg-ink-2 flex h-full flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10"
        >
          <div className="flex h-28 items-center justify-center">
            <div className="skeleton h-16 w-16 rounded-full" />
          </div>
          <div className="space-y-1">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-16 opacity-60" />
          </div>
        </li>
      ))}
    </ul>
  );
}
