'use client';

import { Button } from '@/components/ui/button';
import { RouteStateCard } from './route-state-card';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error(props: Props) {
  return (
    <RouteStateCard
      badge="GitHub paused"
      title="We couldn't reveal this developer."
      body="You're most likely rate limited, or something unexpected went wrong. Give it a minute and try again."
      action={
        <Button type="button" onClick={props.reset} variant="secondary" className="h-10 px-4 text-sm">
          Try again
        </Button>
      }
      meta={
        props.error.digest ? (
          <span className="text-muted/70 dark:text-muted-dark/70 font-mono text-[10px] tracking-wide uppercase">
            Error {props.error.digest}
          </span>
        ) : null
      }
    />
  );
}
