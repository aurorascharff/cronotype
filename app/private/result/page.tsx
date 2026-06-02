import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Crossfade } from '@/components/ui/crossfade';
import { HeroCard } from '@/features/profile/components/hero-card';
import { CronotypeProfileSkeleton } from '@/features/profile/components/cronotype-profile';
import { getPrivateResultCookie } from '@/features/private/private-result-cookie';
import { ARCHETYPES } from '@/lib/archetypes';
import { formatCount } from '@/lib/format';

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
      <Suspense fallback={<PrivateResultSkeleton />}>
        <Crossfade>
          <PrivateResult />
        </Crossfade>
      </Suspense>
    </div>
  );
}

async function PrivateResult() {
  const result = await getPrivateResultCookie();
  if (!result) notFound();
  const archetype = ARCHETYPES[result.archetypeId];

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="text-lg font-semibold tracking-tight">Private cronotype</h1>
        <span className="text-muted/70 dark:text-muted-dark/70 text-[10.5px] tracking-wide uppercase">
          {formatCount(result.stats.total)} private-visible signal commits
        </span>
      </header>
      <HeroCard profile={result.profile} archetype={archetype} stats={result.stats} percentile={result.percentile} />
      <p className="text-muted dark:text-muted-dark max-w-2xl text-sm">
        This is a local, short-lived result from commits visible to your GitHub token. The token is not stored, and this
        page is not shareable.
      </p>
    </section>
  );
}

function PrivateResultSkeleton() {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="text-lg font-semibold tracking-tight">Private cronotype</h1>
        <div className="skeleton h-3 w-36 rounded-full" aria-hidden />
      </header>
      <CronotypeProfileSkeleton />
    </section>
  );
}
