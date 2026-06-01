import { Suspense } from 'react';
import { Crossfade } from '@/components/crossfade';
import InlineErrorBoundary from '@/components/inline-error-boundary';
import { RecentRevealed, RecentRevealedSkeleton } from '@/features/leaderboard/components/recent-revealed';
import { CronotypeProfile, CronotypeProfileSkeleton } from '@/features/profile/components/cronotype-profile';
import { EvolutionStrip, EvolutionStripSkeleton } from '@/features/profile/components/evolution-strip';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';
import type { Metadata } from 'next';

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
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) {
      return { title: `@${login} not found` };
    }
    return { title: `@${login}` };
  }
}

export default function ProfilePage({ params }: PageProps<'/u/[login]'>) {
  return (
    <>
      <Crossfade>
        <Suspense fallback={<CronotypeProfileSkeleton />}>
          {params.then(({ login }) => (
            <CronotypeProfile login={login.toLowerCase()} />
          ))}
        </Suspense>
      </Crossfade>
      <Crossfade>
        <Suspense fallback={<EvolutionStripSkeleton />}>
          <InlineErrorBoundary
            title="We couldn't load this history right now."
            body="Your main reading is still visible. Try again to fetch the full timeline."
          >
            {params.then(({ login }) => (
              <EvolutionStrip login={login.toLowerCase()} />
            ))}
          </InlineErrorBoundary>
        </Suspense>
      </Crossfade>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Recently revealed</h2>
        <Crossfade>
          <Suspense fallback={<RecentRevealedSkeleton limit={12} />}>
            {params.then(({ login }) => (
              <RecentRevealed excludeLogin={login.toLowerCase()} limit={12} />
            ))}
          </Suspense>
        </Crossfade>
      </section>
    </>
  );
}
