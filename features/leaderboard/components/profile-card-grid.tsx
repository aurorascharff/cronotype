import Link from 'next/link';
import Image from 'next/image';
import type { ComponentProps } from 'react';
import { ClassifyingRing } from '@/components/ui/classifying-ring';
import { GitHubIcon } from '@/components/ui/icons';
import { RadialChip } from '@/components/ui/radial-chip';
import { getCardCronotype, getCardProfile } from '@/features/leaderboard/leaderboard-queries';
import { QUIET_THEME } from '@/lib/archetypes';
import { formatFollowers } from '@/lib/format';

type CardHref = ComponentProps<typeof Link>['href'];

export async function ProfileCardSlot({ handle, href }: { handle: string; href?: CardHref }) {
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
      <Link href={href ?? { pathname: `/${handle}` }} className="flex h-full flex-col gap-3 p-3 sm:gap-4 sm:p-4">
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
        <GitHubIcon className="h-3.5 w-3.5" />
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
