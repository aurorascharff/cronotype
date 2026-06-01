'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { regenerateUser } from '@/features/profile/profile-actions';

type Props = {
  login: string;
};

export function RegenerateButton({ login }: Props) {
  const [isWorking, setIsWorking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = isWorking || isPending;

  function regenerate() {
    if (busy) return;
    setIsWorking(true);
    startTransition(async () => {
      try {
        await regenerateUser(login);
        toast.success('Regenerated from fresh data.');
      } catch {
        toast.error("Couldn't regenerate right now. Try again in a moment.");
      } finally {
        setIsWorking(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={regenerate}
      disabled={busy}
      aria-busy={busy}
      className="bg-brand text-on-brand dark:text-ink group/btn ring-brand/20 hover:ring-brand/40 inline-flex min-w-28 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition-[filter,opacity,box-shadow] hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
    >
      <span>{busy ? 'Regenerating' : 'Regenerate'}</span>
      {busy ? <Spinner /> : <RefreshIcon />}
    </button>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:rotate-45"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-3.51-7.13" />
      <path d="M21 4v6h-6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="animate-spin">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
      <path d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
