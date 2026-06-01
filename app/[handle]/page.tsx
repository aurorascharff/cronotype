import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Crossfade } from '@/components/crossfade';
import InlineErrorBoundary from '@/components/inline-error-boundary';
import { RegenerateButton } from '@/components/regenerate-button';
import { RevealGate } from '@/components/reveal-gate';
import { CronotypeProfile, CronotypeProfileSkeleton } from '@/features/profile/components/cronotype-profile';
import { EvolutionStrip, EvolutionStripSkeleton } from '@/features/profile/components/evolution-strip';
import { isValidGitHubHandle } from '@/lib/github-handle';
import { hasBeenRevealed } from '@/lib/reveals';
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
    <>
      <section className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
          <div className="skeleton h-8 w-28 rounded-lg" aria-hidden />
        </header>
        <CronotypeProfileSkeleton />
      </section>
      <section className="space-y-4">
        <EvolutionStripSkeleton />
      </section>
    </>
  );
}

async function ProfileContent({ handle }: { handle: string }) {
  if (!isValidGitHubHandle(handle)) notFound();

  await connection();
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
    </>
  );
}
