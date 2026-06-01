'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function RefreshPartial() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="text-muted/70 dark:text-muted-dark/70 hover:text-ink dark:hover:text-paper inline-flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-[10.5px] tracking-wide uppercase transition-colors hover:border-black/10 disabled:opacity-60 dark:hover:border-white/10"
    >
      <span aria-hidden className={`inline-block h-2.5 w-2.5 ${isPending ? 'animate-spin' : ''}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-3.51-7.13" />
          <path d="M21 4v6h-6" />
        </svg>
      </span>
      <span>{isPending ? 'Refreshing' : 'Refresh'}</span>
    </button>
  );
}
