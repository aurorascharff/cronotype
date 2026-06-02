import Link from 'next/link';
import Image from 'next/image';
import { FEATURED_HANDLES } from '@/features/leaderboard/data/featured-handles';
import { getSuggestedProfiles } from '@/features/leaderboard/leaderboard-queries';
import { listFeaturedReveals } from '@/lib/reveals';

const SUGGESTED_SKELETON_COUNT = 12;

export async function SuggestedUsers() {
  const revealed = new Set((await listFeaturedReveals(FEATURED_HANDLES.length)).map(handle => handle.toLowerCase()));
  const handles = FEATURED_HANDLES.filter(handle => !revealed.has(handle.toLowerCase()));
  const profiles = await getSuggestedProfiles(handles);

  if (handles.length === 0) {
    return (
      <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-black/10 p-8 text-center text-sm dark:border-white/10">
        All suggested users have been revealed.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
      {handles.map((handle, index) => {
        const profile = profiles[index];
        return (
          <li key={handle}>
            <Link
              href={{ pathname: `/${handle}` }}
              className="dark:bg-ink-2 group flex min-w-0 flex-col items-center gap-2 rounded-xl border border-black/10 bg-white p-3 transition-colors hover:border-black/30 sm:p-4 dark:border-white/10 dark:hover:border-white/30"
            >
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border border-black/10 dark:border-white/10"
                />
              ) : (
                <div className="bg-muted/10 dark:bg-muted-dark/10 flex h-12 w-12 items-center justify-center rounded-full border border-black/10 text-xs font-semibold uppercase dark:border-white/10">
                  {handle.slice(0, 2)}
                </div>
              )}
              <span className="text-muted dark:text-muted-dark max-w-full truncate text-xs">@{handle}</span>
              <span className="text-brand text-[10.5px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
                Reveal →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SuggestedUsersSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" aria-hidden>
      {Array.from({ length: SUGGESTED_SKELETON_COUNT }).map((_, i) => (
        <li
          key={i}
          className="dark:bg-ink-2 flex flex-col items-center gap-2 rounded-xl border border-black/10 bg-white p-3 sm:p-4 dark:border-white/10"
        >
          <div className="skeleton h-12 w-12 rounded-full" />
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
        </li>
      ))}
    </ul>
  );
}
