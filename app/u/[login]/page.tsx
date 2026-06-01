import Link from 'next/link';
import { Suspense } from 'react';
import { ProfileErrorCard } from '@/components/profile-error-card';
import { RecentDiagnosed, RecentDiagnosedSkeleton } from '@/features/leaderboard/components/recent-diagnosed';
import { CronotypeProfile, CronotypeProfileSkeleton } from '@/features/profile/components/cronotype-profile';
import { EvolutionStrip, EvolutionStripSkeleton } from '@/features/profile/components/evolution-strip';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';
import type { Metadata } from 'next';

export const unstable_prefetch = 'force-runtime';

export async function generateMetadata({ params }: PageProps<'/u/[login]'>): Promise<Metadata> {
  const { login: rawLogin } = await params;
  const login = rawLogin.toLowerCase();
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
  // We use `params.then()` three times so each section's Suspense renders its
  // own skeleton immediately on first paint. With a single outer Suspense,
  // only the hero skeleton would show while params resolves; this way the
  // user sees the full page shape (hero + evolution + recent) right away.
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
          <CronotypeProfile login={login.toLowerCase()} />
        ))}
      </Suspense>

      <Suspense fallback={<EvolutionStripSkeleton />}>
        {params.then(({ login }) => (
          <SafeEvolutionStrip login={login.toLowerCase()} />
        ))}
      </Suspense>

      <Suspense fallback={<RecentDiagnosedSkeleton limit={8} />}>
        {params.then(({ login }) => (
          <RecentDiagnosed excludeLogin={login.toLowerCase()} limit={8} />
        ))}
      </Suspense>
    </div>
  );
}

async function SafeEvolutionStrip({ login }: { login: string }) {
  try {
    return <EvolutionStrip login={login} />;
  } catch {
    return (
      <ProfileErrorCard
        title="We couldn't load this history right now."
        body="Your main diagnosis is still visible. Try reloading in a moment if you want the full timeline."
        showHomeLink={false}
      />
    );
  }
}
