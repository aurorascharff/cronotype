'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ProfileErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[cronotype profile error]', error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/60 p-10 text-center backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.03]">
      <h2 className="text-2xl font-semibold tracking-tight">We couldn&apos;t diagnose this developer.</h2>
      <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md">
        Their commit history might be private, or GitHub is being moody. Give it a minute and try again, or pick someone else.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 dark:border-white/10"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-ink text-paper dark:bg-paper dark:text-ink rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
        >
          Diagnose someone else
        </Link>
      </div>
    </div>
  );
}
