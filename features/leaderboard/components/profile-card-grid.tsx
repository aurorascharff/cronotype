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
      className="dark:bg-ink-2 group flex h-full flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
    >
      <div className="relative flex aspect-square items-center justify-center">
        <RadialChip stats={stats} color={archetype.theme.accent} size={140} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt=""
          width={56}
          height={56}
          className="absolute h-14 w-14 rounded-full border border-black/10 dark:border-white/10"
        />
      </div>
      <div className="min-w-0 space-y-0.5">
        <div className="text-ink dark:text-paper truncate text-sm font-semibold">
          {profile.name ?? profile.login}
        </div>
        <div className="text-muted dark:text-muted-dark truncate text-xs">
          @{profile.login} · {archetype.name}
        </div>
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
          className="dark:bg-ink-2 flex h-full flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10"
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
