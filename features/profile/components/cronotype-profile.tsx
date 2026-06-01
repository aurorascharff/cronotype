import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeroCard } from '@/components/hero-card';
import { ShareActions, ShareUrl } from '@/components/share-block';
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

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://cronotype.vercel.app';
  const shareUrl = `${base.replace(/\/$/, '')}/u/${profile.login}`;

  return (
    <div className="space-y-2">
      <div className="relative">
        <HeroCard profile={profile} archetype={archetype} stats={stats} percentile={percentile} />
        <div className="pointer-events-none absolute inset-x-4 bottom-3 z-20 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:inset-x-6 sm:bottom-5">
          <div className="pointer-events-auto">
            <ShareUrl shareUrl={shareUrl} />
          </div>
          <div className="pointer-events-auto">
            <ShareActions shareUrl={shareUrl} archetypeName={archetype.name} accent={archetype.theme.accent} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyProfile({ login }: { login: string }) {
  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10">
      <h2 className="text-2xl font-semibold tracking-tight">@{login} hasn&apos;t pushed in the last 90 days.</h2>
      <Link
        href="/"
        className="bg-brand text-on-brand mt-6 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-[filter,opacity] hover:brightness-105"
      >
        Try another handle
      </Link>
    </div>
  );
}

export function CronotypeProfileSkeleton() {
  return (
    <div
      className="dark:bg-ink-2 text-muted/40 dark:text-muted-dark/40 [aspect-ratio:auto] w-full overflow-hidden rounded-xl border border-black/10 bg-white sm:[aspect-ratio:1200/630] dark:border-white/10"
      aria-hidden
    >
      <div className="grid h-full grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
        <div className="flex items-center justify-center sm:justify-start sm:pl-3">
          <HaloSkeleton />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="h-3 w-20 rounded-full border border-current" />
          <div className="h-10 w-2/3 rounded-md border border-current sm:h-14" />
          <div className="h-3 w-3/4 rounded-full border border-current" />
          <div className="mt-2 flex gap-x-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-2 w-10 rounded-full border border-current" />
                <div className="h-5 w-12 rounded-md border border-current sm:h-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HaloSkeleton() {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const avatarR = size * 0.22;
  const gap = size * 0.04;
  const inner = avatarR + gap;
  const outer = size * 0.46;
  const barWidth = Math.max(3, size * 0.018);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="text-muted/40 dark:text-muted-dark/40 h-[140px] w-[140px] overflow-visible sm:h-[220px] sm:w-[220px]"
      aria-hidden
    >
      <circle cx={cx} cy={cy} r={inner - 1} fill="none" stroke="currentColor" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={outer + 1} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.5} />
      <circle cx={cx} cy={cy} r={avatarR} fill="currentColor" fillOpacity={0.08} stroke="currentColor" strokeWidth={1.5} />
      {Array.from({ length: 24 }).map((_, h) => {
        const len = (outer - inner) * (0.35 + 0.4 * Math.abs(Math.sin((h / 24) * Math.PI * 2)));
        return (
          <rect
            key={h}
            x={cx - barWidth / 2}
            y={cy - inner - len}
            width={barWidth}
            height={len}
            fill="currentColor"
            transform={`rotate(${(h / 24) * 360}, ${cx}, ${cy})`}
          />
        );
      })}
    </svg>
  );
}
