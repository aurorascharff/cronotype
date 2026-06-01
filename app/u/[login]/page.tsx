import Link from 'next/link';
import { Suspense } from 'react';
import { RecentDiagnosed, RecentDiagnosedSkeleton } from '@/features/leaderboard/components/recent-diagnosed';
import { CronotypeProfile, CronotypeProfileSkeleton } from '@/features/profile/components/cronotype-profile';
import { EvolutionStrip, EvolutionStripSkeleton } from '@/features/profile/components/evolution-strip';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps<'/u/[login]'>): Promise<Metadata> {
  const { login } = await params;
  try {
    const { archetype, percentile, profile } = await computeCronotype(login, '90d');
    const title = `${profile.name ?? '@' + profile.login} is a ${archetype.name}`;
    const description = `${archetype.tagline} ${percentile}th percentile.`;
    return {
      description,
      openGraph: { description, title, type: 'profile' },
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
    <div className="space-y-10">
      <header>
        <Link
          href="/"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          ← Diagnose another
        </Link>
      </header>

      <Suspense fallback={<CronotypeProfileSkeleton />}>
        {params.then(({ login }) => (
          <>
            <CronotypeProfile login={login} />
            <Suspense fallback={<EvolutionStripSkeleton />}>
              <EvolutionStrip login={login} />
            </Suspense>
            <Suspense fallback={<RecentDiagnosedSkeleton limit={8} />}>
              <RecentDiagnosed excludeLogin={login} limit={8} />
            </Suspense>
          </>
        ))}
      </Suspense>
    </div>
  );
}
