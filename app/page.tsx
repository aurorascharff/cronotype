import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { TopRevealed, TopRevealedSkeleton } from '@/features/leaderboard/components/top-revealed';
import { SuggestedUsers, SuggestedUsersSkeleton } from '@/features/leaderboard/components/suggested-users';
import { UsernameForm } from '@/components/username-form';

function parsePage(value: string | string[] | undefined): number {
  const n = Number(value);
  return n > 0 && Number.isInteger(n) ? n : 1;
}

export default function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="space-y-5 pt-4 sm:pt-10">
        <h1 className="tracking-tightest mx-auto max-w-xl text-center text-2xl leading-tight font-semibold sm:text-4xl">
          What type of developer are you?
        </h1>
        <p className="text-muted dark:text-muted-dark mx-auto max-w-md text-center text-sm">
          Enter a GitHub handle and get a commit-time archetype, shareable card, and optional history chart.
        </p>
        <div className="mx-auto max-w-md">
          <UsernameForm />
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Top revealed</h2>
        <Suspense
          fallback={
            <>
              <TopRevealedSkeleton />
              <section className="space-y-4 pt-8 sm:pt-12">
                <h2 className="text-lg font-semibold tracking-tight">Suggested</h2>
                <SuggestedUsersSkeleton />
              </section>
            </>
          }
        >
          <Crossfade>
            {searchParams.then(query => (
              <>
                <TopRevealed />
                <section className="space-y-4 pt-8 sm:pt-12">
                  <h2 className="text-lg font-semibold tracking-tight">Suggested</h2>
                  <SuggestedUsers page={parsePage(query.suggested)} />
                </section>
              </>
            ))}
          </Crossfade>
        </Suspense>
      </section>
    </div>
  );
}
