'use client';

import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';

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
        <TimelinePromptLoading />
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

function TimelinePromptLoading() {
  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
        <div className="flex items-center gap-2">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-5 w-24 rounded-md" />
        </div>
      </header>
      <div
        className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-4 sm:p-8 dark:border-white/10"
        aria-hidden
      >
        <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4">
          <li className="flex items-center gap-1.5">
            <span className="bg-muted/30 dark:bg-muted-dark/30 h-2 w-2 rounded-full" />
            <span className="skeleton h-3 w-20" />
          </li>
          <li className="flex items-center gap-1.5">
            <span className="bg-muted/30 dark:bg-muted-dark/30 h-2 w-2 rounded-full" />
            <span className="skeleton h-3 w-16" />
          </li>
          <li className="flex items-center gap-1.5">
            <span className="bg-muted/30 dark:bg-muted-dark/30 h-2 w-2 rounded-full" />
            <span className="skeleton h-3 w-24" />
          </li>
        </ul>

        <div className="relative h-32 sm:h-40">
          <div className="text-muted/60 dark:text-muted-dark/60 absolute inset-0 flex flex-col items-center justify-center gap-2">
            <LoaderCircle className="text-muted/40 dark:text-muted-dark/40 h-5 w-5 animate-spin" aria-hidden />
            <span className="text-[11px] font-medium tracking-wide uppercase">Loading, crunching your history</span>
          </div>
        </div>

        <div className="text-muted/60 dark:text-muted-dark/60 mt-2 flex justify-between text-[10px] tabular-nums">
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
        </div>
      </div>
    </>
  );
}
