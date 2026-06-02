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
import { hasBeenRevealed, hasTimelineLoaded } from '@/lib/reveals';
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

export default function ProfilePage({ params, searchParams }: PageProps<'/[handle]'>) {
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
          {Promise.all([params, searchParams]).then(([{ handle }, query]) => (
            <ProfileContent handle={handle.toLowerCase()} showTimeline={query.history === '1'} />
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
    </>
  );
}

async function ProfileContent({ handle, showTimeline }: { handle: string; showTimeline: boolean }) {
  if (!isValidGitHubHandle(handle)) notFound();

  await connection();
  const revealed = await hasBeenRevealed(handle);
  if (!revealed) return <RevealGate handle={handle} />;

  const shouldShowTimeline = showTimeline || (await hasTimelineLoaded(handle));
  return <GeneratedProfile handle={handle} showTimeline={shouldShowTimeline} />;
}

function GeneratedProfile({ handle, showTimeline }: { handle: string; showTimeline: boolean }) {
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
      {showTimeline ? <TimelineSection handle={handle} /> : <TimelinePrompt handle={handle} />}
    </>
  );
}

function TimelineSection({ handle }: { handle: string }) {
  return (
    <section className="space-y-4">
      <Crossfade>
        <Suspense fallback={<EvolutionStripSkeleton />}>
          <InlineErrorBoundary
            title="We couldn't load this history right now."
            body="GitHub is rate-limited right now. Give it a minute and try again."
          >
            <EvolutionStrip handle={handle} />
          </InlineErrorBoundary>
        </Suspense>
      </Crossfade>
    </section>
  );
}

function TimelinePrompt({ handle }: { handle: string }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
      <div className="dark:bg-ink-2 flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between sm:p-5 dark:border-white/10">
        <p className="text-muted dark:text-muted-dark max-w-xl text-sm">
          The long-term chart takes a little more GitHub data, so load it when you want the full history.
        </p>
        <Link
          href={`/${handle}?history=1`}
          prefetch={false}
          className="bg-brand text-on-brand dark:text-ink ring-brand/20 hover:ring-brand/40 inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold shadow-sm ring-1 transition-[filter,box-shadow] hover:brightness-105"
        >
          View history chart
        </Link>
      </div>
    </section>
  );
}
