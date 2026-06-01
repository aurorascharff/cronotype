'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import { useTransition } from 'react';
import { ClassifyingRing } from '@/components/classifying-ring';
import { refreshCardStats } from '@/features/profile/profile-actions';

type Props = {
  login: string;
  variant: 'ring' | 'em-dash';
};

function CardErrorFallback({ login, variant }: Props, _info: ErrorInfo) {
  const [isPending, startTransition] = useTransition();

  function retry() {
    startTransition(async () => {
      await refreshCardStats(login);
    });
  }

  if (variant === 'ring') {
    if (isPending) return <ClassifyingRing />;
    return <ClassifyingRing failed onRetry={retry} />;
  }

  return (
    <button
      type="button"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        retry();
      }}
      disabled={isPending}
      className="text-muted/60 dark:text-muted-dark/60 hover:text-ink dark:hover:text-paper truncate text-left text-xs transition-colors disabled:opacity-60"
      title="Classification failed - click to retry"
    >
      {isPending ? 'Retrying…' : '—'}
    </button>
  );
}

export default catchError(CardErrorFallback);
