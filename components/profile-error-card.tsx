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
  homeLabel = 'Reveal someone else',
}: Props) {
  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md">{body}</p>
      <div className="mt-6 flex justify-center gap-3">
        {onRetry ? (
          <button
            onClick={onRetry}
            className="rounded-lg border border-black/10 bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/[0.06]"
          >
            {retryLabel}
          </button>
        ) : null}

        {showHomeLink ? (
          <Link
            href="/"
            className="bg-brand text-on-brand rounded-lg px-4 py-2 text-sm font-semibold transition-[filter,opacity] hover:brightness-105"
          >
            {homeLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
