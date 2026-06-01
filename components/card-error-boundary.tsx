'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import { useTransition } from 'react';
import { ClassifyingRing } from '@/components/classifying-ring';
import { refreshCardStats } from '@/features/profile/profile-actions';

type Props = {
  /** Login this card represents - used to target just its cache entry on retry. */
  login: string;
  /**
   * Which fallback to render on error.
   * - 'ring': failed ClassifyingRing with a retry button (for the chip area)
   * - 'em-dash': em-dash text (for the archetype name slot)
   */
  variant: 'ring' | 'em-dash';
};

function CardErrorFallback({ login, variant }: Props, _info: ErrorInfo) {
  const [isPending, startTransition] = useTransition();

  function retry() {
    startTransition(async () => {
      // updateTag invalidates only the stats tag for this login; the server
      // action settling triggers an automatic re-render of the current segment
      // so we don't need router.refresh() or unstable_retry.
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

/**
 * Compact retry boundary for individual card sub-fetches.
 *
 * Retry calls the targeted server action `refreshCardStats(login)`, which
 * invalidates only that login's stats cache. Other cards retain their cached
 * data - no full route refresh.
 */
export default catchError(CardErrorFallback);
