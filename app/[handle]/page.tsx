import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { ProfileCardSection, ProfileCardSectionSkeleton } from '@/features/profile/components/profile-card-section';
import {
  ProfileHistorySection,
  ProfileHistorySectionSkeleton,
} from '@/features/profile/components/profile-history-section';
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
  const imageUrl = `${baseUrl.replace(/\/$/, '')}/${handle}/opengraph-image`;
  const title = `@${handle} · Cronotype`;
  const description = `View @${handle}'s commit-time rhythm.`;
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
    <div className="space-y-10">
      <Suspense fallback={<ProfileCardSectionSkeleton />}>
        <Crossfade>
          {params.then(({ handle }) => (
            <ProfileCardSection handle={handle} />
          ))}
        </Crossfade>
      </Suspense>
      <Suspense fallback={<ProfileHistorySectionSkeleton />}>
        <Crossfade>
          {Promise.all([params, searchParams]).then(([{ handle }, query]) => (
            <ProfileHistorySection handle={handle} showTimeline={query.history === '1'} />
          ))}
        </Crossfade>
      </Suspense>
    </div>
  );
}
