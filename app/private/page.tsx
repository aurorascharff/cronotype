import { Suspense } from 'react';
import Link from 'next/link';
import {
  PrivateProfileAuthError,
  PrivateProfileIntro,
  PrivateProfileIntroSkeleton,
  PrivateProfileLoginCard,
  PrivateProfileLoginCardSkeleton,
} from '@/features/profile/components/private-profile-login';

export const unstable_prefetch = 'force-runtime';

export default function PrivatePage({ searchParams }: PageProps<'/private'>) {
  return (
    <div className="mx-auto max-w-2xl space-y-8 pt-4 sm:pt-10">
      <Suspense
        fallback={
          <>
            <PrivateProfileIntroSkeleton />
            <PrivateProfileLoginCardSkeleton />
          </>
        }
      >
        {searchParams.then(({ error }) => (
          <>
            <PrivateProfileIntro />
            {error && <PrivateProfileAuthError error={String(error)} />}
            <PrivateProfileLoginCard />
          </>
        ))}
      </Suspense>
      <Link
        href="/"
        className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper inline-flex text-sm transition-colors"
      >
        ← Back to public cronotype
      </Link>
    </div>
  );
}
