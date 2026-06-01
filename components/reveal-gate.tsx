'use client';

import { useTransition } from 'react';
import { revealUser } from '@/features/profile/profile-actions';

type Props = {
  login: string;
};

export function RevealGate({ login }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="dark:bg-ink-2 flex flex-col items-center gap-4 rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10">
      <h2 className="text-2xl font-semibold tracking-tight">Ready to reveal @{login}?</h2>
      <p className="text-muted dark:text-muted-dark max-w-md text-sm">
        Hit the button to classify their commit rhythm.
      </p>
      <button
        type="button"
        onClick={() => startTransition(() => revealUser(login))}
        disabled={isPending}
        className="bg-brand text-on-brand dark:text-ink mt-2 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-[filter,opacity] hover:brightness-105 disabled:opacity-60"
      >
        {isPending ? 'Revealing…' : 'Reveal'}
      </button>
    </div>
  );
}
