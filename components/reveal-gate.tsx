'use client';

import { useState, useTransition } from 'react';
import { revealUserAndRedirect } from '@/features/profile/profile-actions';

type Props = {
  login: string;
};

export function RevealGate({ login }: Props) {
  const [isWorking, setIsWorking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = isWorking || isPending;

  function reveal() {
    if (busy) return;
    setIsWorking(true);
    startTransition(async () => {
      try {
        await revealUserAndRedirect(login);
      } catch {
        setIsWorking(false);
      }
    });
  }

  return (
    <div className="dark:bg-ink-2 overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10">
      <button
        type="button"
        onClick={reveal}
        disabled={busy}
        aria-busy={busy}
        className="group/reveal flex w-full flex-col items-center gap-5 p-6 text-center transition-colors hover:bg-black/[0.02] disabled:cursor-wait sm:p-10 dark:hover:bg-white/[0.03]"
      >
        <span className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
          <span className="border-brand/20 absolute inset-0 rounded-full border" />
          <span
            className={`border-brand absolute inset-2 rounded-full border-t-2 border-r-2 border-b-2 border-l-transparent ${busy ? 'animate-spin' : 'transition-transform group-hover/reveal:rotate-45'}`}
          />
          <span className="bg-brand/10 text-brand flex h-14 w-14 items-center justify-center rounded-full font-mono text-sm font-semibold sm:h-16 sm:w-16">
            @{login.slice(0, 2).toUpperCase()}
          </span>
        </span>
        <span className="flex max-w-md flex-col gap-2">
          <span className="text-xl font-semibold tracking-tight break-words sm:text-2xl">
            {busy ? `Revealing @${login}` : `Ready to reveal @${login}?`}
          </span>
          <span className="text-muted dark:text-muted-dark text-sm">
            {busy
              ? 'Fetching GitHub activity, caching the result, and preparing the timeline. This can take a little while.'
              : 'Start the profile generation. The page will update when the reveal has been recorded.'}
          </span>
        </span>
        <span className="text-brand text-xs font-medium tracking-wide uppercase">
          {busy ? 'Working...' : 'Start reveal'}
        </span>
      </button>
    </div>
  );
}
