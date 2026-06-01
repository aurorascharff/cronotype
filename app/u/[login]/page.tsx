import { Suspense } from 'react';
import { Crossfade } from '@/components/crossfade';
import InlineErrorBoundary from '@/components/inline-error-boundary';
import { RegenerateButton } from '@/components/regenerate-button';
import { RevealGate } from '@/components/reveal-gate';
import { RecentRevealed, RecentRevealedSkeleton } from '@/features/leaderboard/components/recent-revealed';
import { CronotypeProfile, CronotypeProfileSkeleton } from '@/features/profile/components/cronotype-profile';
import { EvolutionStrip, EvolutionStripSkeleton } from '@/features/profile/components/evolution-strip';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError, SHELL_LOGIN } from '@/features/profile/profile-queries';
import { hasBeenRevealed } from '@/lib/reveals';
import { cacheLife, cacheTag } from 'next/cache';
import type { Metadata } from 'next';

// Opt the route shell into PPR by pre-generating a synthetic placeholder login
// that bypasses GitHub at build. Real logins are generated on-demand.
export function generateStaticParams() {
  return [{ login: SHELL_LOGIN }];
}

export async function generateMetadata({ params }: PageProps<'/u/[login]'>): Promise<Metadata> {
  const { login: rawLogin } = await params;
  const login = rawLogin.toLowerCase();
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');
  const imageUrl = `${baseUrl.replace(/\/$/, '')}/u/${login}/opengraph-image`;
  try {
    return await getProfileMetadata(login, imageUrl);
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) {
      return { title: `@${login} not found` };
    }
    return { title: `@${login}` };
  }
}

async function getProfileMetadata(login: string, imageUrl: string): Promise<Metadata> {
  'use cache';
  cacheTag(`profile-page-${login}`);
  cacheTag(`profile-${login}`);
  cacheTag(`cronotype-${login}-90d`);
  cacheLife('cronotype');

  const { archetype, percentile, profile } = await computeCronotype(login, '90d');
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

export default function ProfilePage({ params }: PageProps<'/u/[login]'>) {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      {params.then(({ login }) => (
        <ProfileContent login={login.toLowerCase()} />
      ))}
    </Suspense>
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

async function ProfileContent({ login }: { login: string }) {
  if (login !== SHELL_LOGIN) {
    const revealed = await hasBeenRevealed(login);
    if (!revealed) return <RevealGate login={login} />;
  }

  return <GeneratedProfile login={login} />;
}

function GeneratedProfile({ login }: { login: string }) {
  return (
    <>
      <section className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
          <RegenerateButton login={login} />
        </header>
        <Crossfade>
          <Suspense fallback={<CronotypeProfileSkeleton />}>
            <InlineErrorBoundary
              title="We couldn't reveal this developer."
              body="GitHub is rate-limited right now. Give it a minute and try again."
            >
              <CronotypeProfile login={login} />
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
              <EvolutionStrip login={login} />
            </InlineErrorBoundary>
          </Suspense>
        </Crossfade>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Recently revealed</h2>
        <Crossfade>
          <Suspense fallback={<RecentRevealedSkeleton limit={16} />}>
            <RecentRevealed excludeLogin={login} limit={16} />
          </Suspense>
        </Crossfade>
      </section>
    </>
  );
}
