import Link from 'next/link';
import { RecentDiagnosed } from '@/features/leaderboard/components/recent-diagnosed';
import { CronotypeProfile } from '@/features/profile/components/cronotype-profile';
import { computeCronotype } from '@/features/profile/profile-service';
import { GitHubError } from '@/features/profile/profile-queries';
import type { Metadata } from 'next';

export const unstable_prefetch = 'force-runtime';

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
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          ← Diagnose another
        </Link>
        <Link
          href="/leaderboard"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          Leaderboard →
        </Link>
      </header>

      {params.then(({ login }) => (
        <>
          <CronotypeProfile login={login} />
          <RecentDiagnosed excludeLogin={login} limit={8} />
        </>
      ))}
    </div>
  );
}
