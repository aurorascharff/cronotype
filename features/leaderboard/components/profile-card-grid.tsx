import Link from 'next/link';
import { RadialChip } from '@/components/radial-chip';
import type { LeaderboardEntry } from '@/features/leaderboard/leaderboard-queries';

type Props = {
  entries: LeaderboardEntry[];
};

/**
 * The shared profile card. A square tile with the halo chart up top and the
 * verdict + handle below. Used by the home leaderboard grid and the "recent
 * diagnoses" rail under each profile.
 */
export function ProfileCardGrid({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-white/20 p-8 text-center text-sm">
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
      className="group flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/60 p-4 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/80 dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
    >
      <div className="relative flex aspect-square items-center justify-center">
        <RadialChip stats={stats} color={archetype.theme.accent} size={140} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt=""
          width={56}
          height={56}
          className="absolute h-14 w-14 rounded-full border border-white/40 dark:border-white/10"
        />
      </div>
      <div className="min-w-0 space-y-0.5">
        <div className="truncate text-sm font-semibold" style={{ color: archetype.theme.accent }}>
          {archetype.name}
        </div>
        <div className="text-muted dark:text-muted-dark truncate text-xs">@{profile.login}</div>
      </div>
    </Link>
  );
}

export function ProfileCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/40 p-4 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.02]"
        >
          <div className="skeleton aspect-square rounded-xl" />
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-16 opacity-60" />
          </div>
        </li>
      ))}
    </ul>
  );
}
