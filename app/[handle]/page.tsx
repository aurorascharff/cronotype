import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { ProfileCardSection, ProfileCardSectionSkeleton } from '@/features/profile/components/profile-card-section';
import {
  ProfileHistorySection,
  ProfileHistorySectionSkeleton,
} from '@/features/profile/components/profile-history-section';
import { computeCronotype } from '@/features/profile/profile-queries';
import { parseTeamHandles, parseTeamName, teamUrl } from '@/features/team/team-handles';
import { isValidGitHubHandle } from '@/lib/github-handle';
import type { Metadata } from 'next';

export const unstable_prefetch = 'force-runtime';

export async function generateMetadata({ params }: PageProps<'/[handle]'>): Promise<Metadata> {
  const { handle: rawHandle } = await params;
  const handle = rawHandle.toLowerCase();
  if (!isValidGitHubHandle(handle)) {
    return {
      openGraph: { images: [] },
      title: 'Nothing here',
      twitter: { images: [] },
    };
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');
  const origin = baseUrl.replace(/\/$/, '');
  const imageUrl = `${origin}/${handle}/opengraph-image`;
  let title = `@${handle} · Cronotype`;
  let description = `View @${handle}'s commit-time rhythm.`;

  try {
    const result = await computeCronotype(handle, '90d');
    const displayName = result.profile.name ?? `@${result.profile.login}`;
    const typeName = result.stats.total === 0 ? 'Quiet lately' : result.archetype.name;
    title = `${displayName} is ${typeName}`;
    description =
      result.stats.total === 0
        ? `${displayName} has no recent public signal commits, but the long-term timeline still has shape.`
        : `${displayName}'s commit-time rhythm is ${typeName}. ${result.percentile}th percentile.`;
  } catch {
    // Metadata should enrich a cached profile, not make the route fail when GitHub is rate-limited.
  }

  return {
    description,
    openGraph: {
      description,
      images: [
        {
          alt: `${handle} cronotype profile`,
          height: 630,
          url: imageUrl,
          width: 1200,
        },
      ],
      title,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      description,
      images: [imageUrl],
      title,
    },
    title,
  };
}

export default function ProfilePage({ params, searchParams }: PageProps<'/[handle]'>) {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        {searchParams.then(query => (
          <TeamBackLink handlesParam={query.team} nameParam={query.teamName} />
        ))}
      </Suspense>
      <Suspense fallback={<ProfileCardSectionSkeleton />}>
        <Crossfade>
          {params.then(async ({ handle }) => {
            return <ProfileCardSection handle={handle} />;
          })}
        </Crossfade>
      </Suspense>
      <Suspense fallback={<ProfileHistorySectionSkeleton />}>
        <Crossfade>
          {Promise.all([params, searchParams]).then(async ([{ handle }, query]) => {
            return <ProfileHistorySection handle={handle} showTimeline={query.history === '1'} />;
          })}
        </Crossfade>
      </Suspense>
    </div>
  );
}

function TeamBackLink({
  handlesParam,
  nameParam,
}: {
  handlesParam: string | string[] | undefined;
  nameParam: string | string[] | undefined;
}) {
  const { handles } = parseTeamHandles(handlesParam);
  if (handles.length === 0) return null;
  const name = parseTeamName(nameParam);

  return (
    <div className="-mb-4">
      <a
        href={teamUrl({ handles, name })}
        className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper inline-flex h-7 items-center rounded-md border border-black/10 bg-white/60 px-2 text-[11px] font-semibold shadow-sm transition-colors hover:border-black/25 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/25"
      >
        ← Back to {name || 'team'}
      </a>
    </div>
  );
}
