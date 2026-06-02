import { Suspense } from 'react';
import Link from 'next/link';
import { Crossfade } from '@/components/ui/crossfade';
import {
  PrivateProfileCardSection,
  PrivateProfileCardSectionSkeleton,
} from '@/features/profile/components/private-profile-card-section';

export const unstable_prefetch = 'force-runtime';

export default function PrivateResultPage() {
  return (
    <div className="space-y-10">
      <header>
        <Link
          href="/private"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          ← Run another private check
        </Link>
      </header>
      <Suspense fallback={<PrivateProfileCardSectionSkeleton />}>
        <Crossfade>
          <PrivateProfileCardSection />
        </Crossfade>
      </Suspense>
    </div>
  );
}
