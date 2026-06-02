import Link from 'next/link';
import Image from 'next/image';
import { ClassifyingRing } from '@/components/ui/classifying-ring';
import { RadialChip } from '@/components/ui/radial-chip';
import { getCardCronotype, getCardProfile } from '@/features/leaderboard/leaderboard-queries';
import { QUIET_THEME } from '@/lib/archetypes';
import { formatFollowers } from '@/lib/format';

export async function ProfileCardSlot({ handle }: { handle: string }) {
  const cronotype = await getCardCronotype(handle);
  const profile = cronotype?.profile ?? (await getCardProfile(handle));
  const avatarUrl = profile?.avatarUrl;
  const color = cronotype
    ? cronotype.stats.total === 0
      ? QUIET_THEME.accent
      : cronotype.archetype.theme.accent
    : null;

  return (
    <div className="dark:bg-ink-2 group relative h-full rounded-xl border border-black/10 bg-white transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30">
      <Link href={{ pathname: `/${handle}` }} className="flex h-full flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="relative flex h-28 items-center justify-center">
          <div className="relative h-28 w-28">
            {cronotype ? (
              <RadialChip stats={cronotype.stats} color={color ?? QUIET_THEME.accent} size={112} />
            ) : (
              <ClassifyingRing failed />
            )}
          </div>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={48}
              height={48}
              className="absolute h-12 w-12 rounded-full border border-black/10 dark:border-white/10"
            />
          ) : (
            <div className="bg-muted/10 dark:bg-muted-dark/10 absolute flex h-12 w-12 items-center justify-center rounded-full border border-black/10 text-xs font-semibold uppercase dark:border-white/10">
              {handle.slice(0, 2)}
            </div>
          )}
        </div>
        <CardMeta handle={handle} profile={profile} cronotype={cronotype} />
      </Link>
      <a
        href={`https://github.com/${handle}`}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`Open ${handle} on GitHub`}
        className="text-muted/70 dark:text-muted-dark/70 hover:text-ink dark:hover:text-paper absolute top-2 right-2 rounded-md p-1.5 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.05.78 2.12v3.14c0 .31.21.66.79.55 4.57-1.52 7.86-5.83 7.86-10.91C23.5 5.65 18.35.5 12 .5z" />
        </svg>
      </a>
    </div>
  );
}

function CardMeta({
  handle,
  profile,
  cronotype,
}: {
  handle: string;
  profile: Awaited<ReturnType<typeof getCardProfile>>;
  cronotype: Awaited<ReturnType<typeof getCardCronotype>>;
}) {
  if (!profile) return <CardMetaFallback handle={handle} />;
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-ink dark:text-paper truncate text-sm font-semibold">{profile.name ?? profile.login}</div>
      <div className="text-muted dark:text-muted-dark flex items-baseline gap-1.5 truncate text-xs">
        <span className="truncate">@{profile.login}</span>
        <span aria-hidden className="text-muted/40 dark:text-muted-dark/40">
          ·
        </span>
        <span className="tabular-nums">{formatFollowers(profile.followers)}</span>
      </div>
      {cronotype ? (
        <div
          className="truncate text-xs font-medium"
          style={{
            color: cronotype.stats.total === 0 ? QUIET_THEME.accent : cronotype.archetype.theme.accent,
          }}
        >
          {cronotype.stats.total === 0 ? 'Quiet lately' : cronotype.archetype.name}
        </div>
      ) : (
        <span className="text-muted/40 dark:text-muted-dark/40 truncate text-xs">—</span>
      )}
    </div>
  );
}

function CardMetaFallback({ handle }: { handle: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-ink dark:text-paper truncate text-sm font-semibold">@{handle}</div>
      <div className="text-muted/60 dark:text-muted-dark/60 truncate text-xs">Couldn&apos;t load profile</div>
      <div className="h-4" />
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div
      className="dark:bg-ink-2 relative h-full rounded-xl border border-black/10 bg-white dark:border-white/10"
      aria-hidden
    >
      <div className="skeleton absolute top-2 right-2 h-6 w-6 rounded-md" />
      <div className="flex h-full flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="relative flex h-28 items-center justify-center">
          <div className="relative h-28 w-28">
            <ClassifyingRing />
          </div>
          <div className="skeleton absolute h-12 w-12 rounded-full" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}
