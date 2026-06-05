'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { TimelineLoadingCard } from './timeline-loading-card';

type Props = {
  handle: string;
};

export function TimelinePrompt({ handle }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (loading || isPending) {
    return (
      <section className="space-y-4">
        <TimelineLoadingCard />
      </section>
    );
  }

  function loadHistory() {
    setLoading(true);
    startTransition(async () => {
      router.replace(`/${handle}?history=1`, { scroll: false });
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
      <div className="flex flex-col items-start gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
        <p className="text-muted dark:text-muted-dark max-w-xl text-sm">
          The long-term chart takes a little more GitHub data, so load it when you want the full history.
        </p>
        <Button type="button" onClick={loadHistory} className="h-10 shrink-0 px-4 text-sm" variant="primary">
          View history chart
        </Button>
      </div>
    </section>
  );
}
