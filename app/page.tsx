import { Suspense } from 'react';
import { RecentDiagnosed, RecentDiagnosedSkeleton } from '@/features/leaderboard/components/recent-diagnosed';
import { UsernameForm } from '@/components/username-form';

export default function HomePage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="space-y-5 pt-4 sm:pt-10">
        <h1 className="tracking-tightest mx-auto max-w-xl text-center text-2xl leading-tight font-semibold sm:text-4xl">
          What type of developer are you?
        </h1>
        <p className="text-muted dark:text-muted-dark mx-auto max-w-md text-center text-sm">
          Enter a GitHub handle and get a commit-time archetype, timeline, and shareable profile card.
        </p>
        <div className="mx-auto max-w-md">
          <UsernameForm />
        </div>
      </section>
      <Suspense fallback={<RecentDiagnosedSkeleton limit={16} />}>
        <RecentDiagnosed limit={16} />
      </Suspense>
    </div>
  );
}
