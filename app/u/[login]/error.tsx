'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="border-border dark:border-border-dark dark:bg-ink-2/40 rounded-2xl border bg-white/60 p-10 text-center backdrop-blur-sm">
      <p className="text-bandit mb-3 font-mono text-[11px] tracking-widest uppercase">Error</p>
      <h2 className="text-2xl font-semibold tracking-tight">Something went sideways.</h2>
      <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md">
        Probably GitHub rate-limiting us. Try again in a minute, or set a token in <code>.env.local</code>.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={reset}
          className="border-border dark:border-border-dark hover:bg-ink hover:text-paper dark:hover:bg-paper dark:hover:text-ink rounded-md border bg-transparent px-4 py-2 font-mono text-xs tracking-widest uppercase transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-ink text-paper dark:bg-paper dark:text-ink rounded-md px-4 py-2 font-mono text-xs tracking-widest uppercase transition-opacity hover:opacity-85"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
