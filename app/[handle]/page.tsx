import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Crossfade } from '@/components/crossfade';
import InlineErrorBoundary from '@/components/inline-error-boundary';
import { RegenerateButton } from '@/components/regenerate-button';
import { RevealGate } from '@/components/reveal-gate';
import { RecentRevealed, RecentRevealedSkeleton } from '@/features/leaderboard/components/recent-revealed';
import { CronotypeProfile, CronotypeProfileSkeleton } from '@/features/profile/components/cronotype-profile';
import { EvolutionStrip, EvolutionStripSkeleton } from '@/features/profile/components/evolution-strip';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';
import { isValidGitHubHandle } from '@/lib/github-handle';
import { hasBeenRevealed } from '@/lib/reveals';
import { cacheLife, cacheTag } from 'next/cache';
import type { Metadata } from 'next';

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
  try {
    if (!(await hasBeenRevealed(handle))) {
      return { title: `Reveal @${handle}` };
    }
    return await getProfileMetadata(handle, imageUrl);
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) {
      return { title: `@${handle} not found` };
    }
    return { title: `@${handle}` };
  }
}

async function getProfileMetadata(handle: string, imageUrl: string): Promise<Metadata> {
  'use cache';
  cacheTag(`profile-page-${handle}`);
  cacheTag(`profile-${handle}`);
  cacheTag(`cronotype-${handle}-90d`);
  cacheLife('cronotype');

  const { archetype, percentile, profile } = await computeCronotype(handle, '90d');
  const title = `${profile.name ?? '@' + profile.login} is a ${archetype.name}`;
  const description = `${archetype.tagline} ${percentile}th percentile.`;
  return {
    description,
    openGraph: {
      description,
      images: [
        {
          alt: `${profile.login} cronotype chart`,
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

export default function ProfilePage({ params }: PageProps<'/[handle]'>) {
  return (
    <div className="space-y-10">
      <header>
        <Link
          href="/"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          ← Reveal another
        </Link>
      </header>
      <div className="space-y-10">
        <Suspense fallback={<ProfilePageSkeleton />}>
          {params.then(({ handle }) => (
            <ProfileContent handle={handle.toLowerCase()} />
          ))}
        </Suspense>
      </div>
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
        <div className="skeleton h-8 w-24 rounded-lg" aria-hidden />
      </header>
      <CronotypeProfileSkeleton />
    </section>
  );
}

async function ProfileContent({ handle }: { handle: string }) {
  if (!isValidGitHubHandle(handle)) notFound();

  const revealed = await hasBeenRevealed(handle);
  if (!revealed) return <RevealGate handle={handle} />;

  return <GeneratedProfile handle={handle} />;
}

function GeneratedProfile({ handle }: { handle: string }) {
  return (
    <>
      <section className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
          <RegenerateButton handle={handle} />
        </header>
        <Crossfade>
          <Suspense fallback={<CronotypeProfileSkeleton />}>
            <InlineErrorBoundary
              title="We couldn't reveal this developer."
              body="GitHub is rate-limited right now. Give it a minute and try again."
            >
              <CronotypeProfile handle={handle} />
            </InlineErrorBoundary>
          </Suspense>
        </Crossfade>
      </section>
      <section className="space-y-4">
        <Crossfade>
          <Suspense fallback={<EvolutionStripSkeleton />}>
            <InlineErrorBoundary
              title="We couldn't load this history right now."
              body="GitHub is being moody. Try again in a minute."
            >
              <EvolutionStrip handle={handle} />
            </InlineErrorBoundary>
          </Suspense>
        </Crossfade>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Recently revealed</h2>
        <Crossfade>
          <Suspense fallback={<RecentRevealedSkeleton />}>
            <RecentRevealed excludeHandle={handle} />
          </Suspense>
        </Crossfade>
      </section>
    </>
  );
}
