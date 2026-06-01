import Link from 'next/link';
import { FEATURED } from '@/features/leaderboard/featured';

export function SuggestedUsers() {
  return (
    <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
      {FEATURED.map(login => (
        <li key={login}>
          <Link
            href={{ pathname: `/u/${login}` }}
            prefetch={false}
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
