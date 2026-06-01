'use client';

import Link from 'next/link';

type Props = {
  title: string;
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
  showHomeLink?: boolean;
  homeLabel?: string;
};

export function ProfileErrorCard({
  title,
  body,
  onRetry,
  retryLabel = 'Try again',
  showHomeLink = true,
  homeLabel = 'Diagnose someone else',
}: Props) {
  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md">{body}</p>
      <div className="mt-6 flex justify-center gap-3">
        {onRetry ? (
          <button
            onClick={onRetry}
            className="rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 dark:border-white/10"
          >
            {retryLabel}
          </button>
        ) : null}

        {showHomeLink ? (
          <Link
            href="/"
            className="bg-ink text-paper dark:bg-paper dark:text-ink rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
          >
            {homeLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
