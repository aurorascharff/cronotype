'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { EvolutionStripSkeleton } from '@/features/profile/components/evolution-strip-skeleton';

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
        <EvolutionStripSkeleton />
      </section>
    );
  }

  function loadHistory() {
    setLoading(true);
    startTransition(() => {
      router.push(`/${handle}?history=1`, { scroll: false });
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
      <div className="flex flex-col items-start gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
        <p className="text-muted dark:text-muted-dark max-w-xl text-sm">
          The long-term chart takes a little more GitHub data, so load it when you want the full history.
        </p>
        <button
          type="button"
          onClick={loadHistory}
          className="bg-brand text-on-brand dark:text-ink ring-brand/20 hover:ring-brand/40 inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold shadow-sm ring-1 transition-[filter,box-shadow] hover:brightness-105"
        >
          View history chart
        </button>
      </div>
    </section>
  );
}
