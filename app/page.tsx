import { Suspense } from 'react';
import { RecentDiagnosed, RecentDiagnosedSkeleton } from '@/features/leaderboard/components/recent-diagnosed';
import { UsernameForm } from '@/components/username-form';

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-20">
      <section className="space-y-6 pt-8 sm:pt-16">
        <h1 className="mx-auto max-w-2xl text-3xl leading-tight font-semibold tracking-tightest text-center sm:text-5xl">
          What type of developer are you?
        </h1>

        <div className="mx-auto max-w-xl">
          <UsernameForm />
        </div>
      </section>

      <Suspense fallback={<RecentDiagnosedSkeleton limit={12} />}>
        <RecentDiagnosed limit={12} />
      </Suspense>
    </div>
  );
}
