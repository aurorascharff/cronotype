import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClassifyingRing } from '@/components/classifying-ring';
import { HaloChart } from '@/components/halo-chart';
import { HeroCard } from '@/components/hero-card';
import { ShareActions, ShareUrl } from '@/components/share-block';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';
import { formatFollowers } from '@/lib/format';
import { cacheLife, cacheTag } from 'next/cache';
import type { Archetype, HourStats, ProfileSummary } from '@/types/cronotype';

type Props = {
  login: string;
};

export async function CronotypeProfile({ login }: Props) {
  'use cache';
  cacheTag(`profile-${login}`);
  cacheTag(`cronotype-${login}-90d`);
  cacheLife('cronotype');

  let result;
  try {
    result = await computeCronotype(login, '90d');
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) notFound();
    throw err;
  }

  const { profile, archetype, stats, percentile } = result;

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://cronotype.vercel.app';
  const shareUrl = `${base.replace(/\/$/, '')}/u/${profile.login}`;

  return (
    <div className="relative">
      {stats.total === 0 ? (
        <NoRecentProfileCard profile={profile} archetype={archetype} stats={stats} />
      ) : (
        <HeroCard profile={profile} archetype={archetype} stats={stats} percentile={percentile} />
      )}
      <div className="mt-3 flex min-w-0 flex-col gap-2 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between sm:pointer-events-none sm:absolute sm:inset-x-6 sm:bottom-5 sm:z-20 sm:mt-0">
        <div className="min-w-0 sm:pointer-events-auto">
          <ShareUrl shareUrl={shareUrl} />
        </div>
        <div className="min-w-0 sm:pointer-events-auto">
          <ShareActions
            shareUrl={shareUrl}
            archetypeName={stats.total === 0 ? 'quiet lately' : archetype.name}
            accent={archetype.theme.accent}
            login={profile.login}
          />
        </div>
      </div>
    </div>
  );
}

function NoRecentProfileCard({
  profile,
  archetype,
  stats,
}: {
  profile: ProfileSummary;
  archetype: Archetype;
  stats: HourStats;
}) {
  const { theme } = archetype;
  const joined = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(profile.createdAt),
  );

  return (
    <article
      className="dark:bg-ink-2 relative [aspect-ratio:auto] w-full overflow-hidden rounded-xl border border-black/10 bg-white sm:[aspect-ratio:1200/630] dark:border-white/10"
      style={{ viewTransitionName: 'hero-card' }}
    >
      <div className="text-ink/70 dark:text-paper/80 absolute top-3 right-3 z-10 rounded-lg border border-black/15 bg-white/95 px-2 py-1 font-mono text-[10px] tracking-wider uppercase backdrop-blur-sm sm:top-6 sm:right-6 dark:border-white/20 dark:bg-white/[0.10]">
        No 90d signal
      </div>

      <div className="grid h-full grid-cols-1 items-center gap-4 p-5 pt-11 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
        <div className="mx-auto flex h-44 w-44 items-center justify-center opacity-85 min-[420px]:h-52 min-[420px]:w-52 sm:mx-0 sm:h-[220px] sm:w-[220px] sm:justify-start sm:pl-3">
          <HaloChart stats={stats} theme={theme} avatarUrl={profile.avatarUrl} size={220} />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="text-muted dark:text-muted-dark flex flex-wrap items-baseline gap-x-2 text-xs sm:text-sm">
            <a
              href={`https://github.com/${profile.login}`}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-ink dark:hover:text-paper transition-colors"
            >
              @{profile.login}
            </a>
            <span aria-hidden className="text-muted/40 dark:text-muted-dark/40">
              ·
            </span>
            <span className="tabular-nums">{formatFollowers(profile.followers)}</span>
          </div>
          <h1
            className="tracking-tightest text-4xl leading-[0.98] font-semibold break-words min-[420px]:text-5xl sm:text-6xl"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.accent2}, ${theme.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Quiet lately
          </h1>
          <p className="text-muted dark:text-muted-dark max-w-md text-sm sm:text-base">
            This profile is here, and the long-term timeline still has shape. There just aren&apos;t public commits in
            the last 90 days to classify a current rhythm.
          </p>

          <Link
            href={`/types#${archetype.id}`}
            className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper w-fit text-xs underline-offset-2 transition-colors hover:underline"
            style={{ color: theme.accent }}
          >
            Closest type: {archetype.name} →
          </Link>

          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:mt-2 sm:flex sm:flex-wrap sm:items-end sm:gap-x-6">
            <ProfileStat label="90d commits" value="0" accent={theme.accent} />
            <ProfileStat label="Followers" value={formatFollowers(profile.followers)} />
            <ProfileStat label="Repos" value={String(profile.publicRepos)} />
            <ProfileStat label="Joined" value={joined} />
          </dl>
        </div>
      </div>
    </article>
  );
}

function ProfileStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted dark:text-muted-dark text-[10px] tracking-wider uppercase sm:text-xs">{label}</dt>
      <dd
        className="text-ink dark:text-paper mt-0.5 text-lg font-semibold tabular-nums sm:text-2xl"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

export function CronotypeProfileSkeleton() {
  return (
    <div className="relative" aria-hidden>
      <div className="dark:bg-ink-2 relative [aspect-ratio:auto] w-full overflow-hidden rounded-xl border border-black/10 bg-white sm:[aspect-ratio:1200/630] dark:border-white/10">
        <div className="absolute top-3 right-3 z-10 rounded-lg border border-black/15 bg-white/95 px-2 py-1 font-mono text-[10px] tracking-wider text-transparent uppercase backdrop-blur-sm sm:top-6 sm:right-6 dark:border-white/20 dark:bg-white/[0.10]">
          Last 90 days
        </div>

        <div className="grid h-full grid-cols-1 items-center gap-4 p-5 pt-11 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
          <div className="relative flex items-center justify-center sm:justify-start sm:pl-3">
            <div className="relative flex h-[140px] w-[140px] items-center justify-center sm:h-[220px] sm:w-[220px]">
              <ClassifyingRing variant="inset" />
              <div className="skeleton h-[44%] w-[44%] rounded-full" />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-10 w-3/5 rounded min-[420px]:h-12 sm:h-14" />
            <div className="skeleton h-4 w-4/5 max-w-md rounded" />
            <div className="skeleton h-3 w-32 rounded" />
            <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 sm:mt-2 sm:flex sm:flex-wrap sm:items-end sm:gap-x-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="skeleton h-2.5 w-12 rounded" />
                  <div className="skeleton h-6 w-14 rounded sm:h-7" />
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <div className="mt-3 flex min-w-0 flex-col gap-2 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between sm:pointer-events-none sm:absolute sm:inset-x-6 sm:bottom-5 sm:z-20 sm:mt-0">
        <div className="skeleton h-4 w-full max-w-64 rounded sm:h-5" />
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="skeleton h-9 w-9 rounded-lg min-[520px]:w-24" />
          ))}
        </div>
      </div>
    </div>
  );
}
