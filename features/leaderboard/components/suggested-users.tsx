import Link from 'next/link';
import { FEATURED } from '@/features/leaderboard/featured';
import { listFeaturedReveals } from '@/lib/reveals';
import { connection } from 'next/server';

export async function SuggestedUsers() {
  await connection();

  const revealed = new Set((await listFeaturedReveals(FEATURED.length)).map(login => login.toLowerCase()));
  const logins = FEATURED
    .filter(login => !revealed.has(login.toLowerCase()));

  if (logins.length === 0) {
    return (
      <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-black/10 p-8 text-center text-sm dark:border-white/10">
        All suggested users have been revealed.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
      {logins.map(login => (
        <li key={login}>
          <Link
            href={{ pathname: `/u/${login}` }}
            className="dark:bg-ink-2 group flex min-w-0 flex-col items-center gap-2 rounded-xl border border-black/10 bg-white p-3 transition-colors hover:border-black/30 sm:p-4 dark:border-white/10 dark:hover:border-white/30"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://github.com/${login}.png?size=96`}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-full border border-black/10 dark:border-white/10"
            />
            <span className="text-muted dark:text-muted-dark max-w-full truncate text-xs">@{login}</span>
            <span className="text-brand text-[10.5px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
              Reveal →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SuggestedUsersSkeleton() {
  const count = Math.ceil(FEATURED.length / 2);

  return (
    <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="dark:bg-ink-2 flex flex-col items-center gap-2 rounded-xl border border-black/10 bg-white p-3 sm:p-4 dark:border-white/10">
          <div className="skeleton h-12 w-12 rounded-full" />
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
        </li>
      ))}
    </ul>
  );
}
