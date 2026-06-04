import { Suspense } from 'react';
import Link from 'next/link';
import { Crossfade } from '@/components/ui/crossfade';
import { FeaturedProfiles, FeaturedProfilesSkeleton } from '@/features/leaderboard/components/featured-profiles';
import { UsernameForm } from '@/components/username-form';

export const unstable_prefetch = 'force-runtime';

function parsePage(value: string | string[] | undefined): number {
  const n = Number(value);
  return n > 0 && Number.isInteger(n) ? n : 1;
}

export default function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="space-y-4 pt-1 sm:pt-2">
        <h1 className="tracking-tightest mx-auto max-w-xl text-center text-2xl leading-tight font-semibold sm:text-4xl">
          What type of developer are you?
        </h1>
        <p className="text-muted dark:text-muted-dark mx-auto max-w-md text-center text-sm">
          Enter a GitHub handle and get a commit-time archetype, shareable card, and optional history chart.
        </p>
        <div className="mx-auto max-w-md">
          <UsernameForm />
        </div>
        <p className="text-muted dark:text-muted-dark text-center text-xs sm:text-sm">
          Making a team view?{' '}
          <Link href="/team" className="text-ink dark:text-paper font-medium underline-offset-2 hover:underline">
            Build a gallery
          </Link>
          .
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Featured</h2>
        <Suspense
          fallback={
            <>
              <FeaturedProfilesSkeleton />
            </>
          }
        >
          <Crossfade>
            {searchParams.then(query => (
              <FeaturedProfiles page={parsePage(query.featured)} />
            ))}
          </Crossfade>
        </Suspense>
      </section>
    </div>
  );
}
