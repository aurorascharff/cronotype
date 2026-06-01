'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { regenerateUser } from '@/features/profile/profile-actions';

type Props = {
  login: string;
};

export function RegenerateButton({ login }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await regenerateUser(login);
          toast.success('Regenerated from fresh data.');
        })
      }
      disabled={isPending}
      className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper inline-flex min-w-24 items-center gap-1.5 rounded-lg border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.06] dark:hover:bg-white/[0.12]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`}
        aria-hidden
      >
        <path d="M21 12a9 9 0 1 1-3.51-7.13" />
        <path d="M21 4v6h-6" />
      </svg>
      <span className="inline-block min-w-16 text-left">{isPending ? 'Regenerating' : 'Regenerate'}</span>
    </button>
  );
}
