'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { RegenerateFromParamsButton } from '@/features/profile/components/regenerate-button';
import { RouteStateCard } from './route-state-card';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
      <RouteStateCard
        badge="GitHub paused"
        title="We couldn't reveal this developer."
        body="You're most likely rate limited, or something unexpected went wrong. Give it a minute and try again."
        meta={
          error.digest ? (
            <span className="text-muted/70 dark:text-muted-dark/70 font-mono text-[10px] tracking-wide uppercase">
              Error {error.digest}
            </span>
          ) : null
        }
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" onClick={reset} variant="secondary" className="h-10 px-4 text-sm">
          Try again
        </Button>
        <Suspense fallback={null}>
          <RegenerateFromParamsButton />
        </Suspense>
      </div>
    </section>
  );
}
