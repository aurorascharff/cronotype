import { Suspense } from 'react';
import { CronotypeProfile, CronotypeProfileSkeleton } from '@/features/profile/components/cronotype-profile';
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
    <Suspense fallback={<CronotypeProfileSkeleton />}>
      {params.then(({ login }) => (
        <CronotypeProfile login={login} />
      ))}
    </Suspense>
  );
}
