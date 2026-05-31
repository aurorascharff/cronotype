import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeroCard } from '@/components/hero-card';
import { ShareBlock } from '@/components/share-block';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';

type Props = {
  login: string;
};

export async function CronotypeProfile({ login }: Props) {
  let result;
  try {
    result = await computeCronotype(login, '90d');
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) notFound();
    throw err;
  }

  const { profile, archetype, stats, percentile } = result;

  if (stats.total === 0) {
    return <EmptyProfile login={login} />;
  }

  const bioLine = `Cronotype: ${archetype.name} · cronotype.dev/u/${profile.login}`;

  return (
    <div className="space-y-4">
      <HeroCard profile={profile} archetype={archetype} stats={stats} percentile={percentile} />
      <ShareBlock bioLine={bioLine} />
    </div>
  );
}

function EmptyProfile({ login }: { login: string }) {
  return (
    <div className="border-border dark:border-border-dark dark:bg-ink-2/40 rounded-2xl border bg-white/60 p-12 text-center backdrop-blur-sm">
      <h2 className="text-2xl font-semibold tracking-tight">
        @{login} hasn&apos;t pushed in the last 90 days.
      </h2>
      <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md">
        Either this account is private, brand-new, or practicing remarkable restraint.
      </p>
      <Link
        href="/"
        className="bg-ink text-paper dark:bg-paper dark:text-ink mt-6 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
      >
        Try another handle
      </Link>
    </div>
  );
}

export function CronotypeProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border-border dark:border-border-dark dark:bg-ink-2/40 rounded-2xl border bg-white/60 p-8 backdrop-blur-sm sm:p-12">
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-16 opacity-60" />
          </div>
        </div>
        <div className="skeleton mt-8 h-12 w-2/3 sm:h-16" />
        <div className="skeleton mt-3 h-4 w-3/4" />
        <div className="mt-10 flex h-32 items-end gap-[3px] sm:h-40">
          {Array.from({ length: 24 }).map((_, i) => {
            const h = 18 + ((i * 11) % 60);
            return <div key={i} className="skeleton flex-1 rounded-t-sm" style={{ height: `${h}%` }} />;
          })}
        </div>
        <div className="mt-8 flex items-end justify-between">
          <div className="flex gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-3 w-12 opacity-60" />
                <div className="skeleton h-4 w-10" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-right">
            <div className="skeleton ml-auto h-7 w-14" />
            <div className="skeleton ml-auto h-3 w-16 opacity-60" />
          </div>
        </div>
      </div>
      <div className="skeleton h-12 rounded-xl" />
    </div>
  );
}
