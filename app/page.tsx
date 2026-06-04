import { Suspense } from 'react';
import Link from 'next/link';
import { Crossfade } from '@/components/ui/crossfade';
import { TopRevealed, TopRevealedSkeleton } from '@/features/leaderboard/components/top-revealed';
import { SuggestedUsers, SuggestedUsersSkeleton } from '@/features/leaderboard/components/suggested-users';
import { UsernameForm } from '@/components/username-form';

export const unstable_prefetch = 'force-runtime';

function parsePage(value: string | string[] | undefined): number {
  const n = Number(value);
  return n > 0 && Number.isInteger(n) ? n : 1;
}

export default function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="space-y-4 pt-1 sm:pt-4">
        <h1 className="tracking-tightest mx-auto max-w-xl text-center text-2xl leading-tight font-semibold sm:text-4xl">
          What type of developer are you?
        </h1>
        <p className="text-muted dark:text-muted-dark mx-auto max-w-md text-center text-sm">
          Enter a GitHub handle and get a commit-time archetype, shareable card, and optional history chart.
        </p>
        <div className="mx-auto max-w-md">
          <UsernameForm />
        </div>
        <p className="text-muted dark:text-muted-dark text-center text-xs">
          Making a team view?{' '}
          <Link href="/team" className="text-ink dark:text-paper underline-offset-2 hover:underline">
            Build a gallery
          </Link>
          .
        </p>
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
                <TopRevealed page={parsePage(query.revealed)} />
                <section className="space-y-4 pt-8 sm:pt-12">
                  <h2 className="text-lg font-semibold tracking-tight">Suggested</h2>
                  <SuggestedUsers />
                </section>
              </>
            ))}
          </Crossfade>
        </Suspense>
      </section>
    </div>
  );
}
