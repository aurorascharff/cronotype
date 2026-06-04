'use client';

import { Suspense } from 'react';
import { RegenerateFromParamsButton } from '@/features/profile/components/regenerate-button';
import { RouteStateCard } from './route-state-card';

type Props = {
  error: Error & { digest?: string };
};

export default function Error({ error }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
      <RouteStateCard
        badge="GitHub paused"
        title="We couldn't reveal this developer."
        body="GitHub may be rate limited. Wait a minute and refresh the page. If it still doesn't work, click Regenerate."
        variant="error"
        meta={
          error.digest ? (
            <span className="text-muted/70 dark:text-muted-dark/70 font-mono text-[10px] tracking-wide uppercase">
              Error {error.digest}
            </span>
          ) : null
        }
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Suspense
          fallback={
            <div className="h-10 w-32 rounded-lg border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.04]" />
          }
        >
          <RegenerateFromParamsButton />
        </Suspense>
      </div>
    </section>
  );
}
