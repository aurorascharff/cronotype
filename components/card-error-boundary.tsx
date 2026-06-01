'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import { ClassifyingRing } from '@/components/classifying-ring';

type Props = {
  /**
   * Which fallback to render on error.
   * - 'ring': failed ClassifyingRing with a retry button (for the chip area)
   * - 'em-dash': em-dash text (for the archetype name slot)
   */
  variant: 'ring' | 'em-dash';
};

function CardErrorFallback({ variant }: Props, { unstable_retry: retry }: ErrorInfo) {
  if (variant === 'ring') {
    return <ClassifyingRing failed onRetry={() => retry()} />;
  }
  return (
    <button
      type="button"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        retry();
      }}
      className="text-muted/60 dark:text-muted-dark/60 hover:text-ink dark:hover:text-paper truncate text-left text-xs transition-colors"
      title="Classification failed - click to retry"
    >
      —
    </button>
  );
}

/**
 * Compact retry boundary for individual card sub-fetches.
 *
 * The boundary renders its own fallback variants since the retry callback
 * must stay client-side - functions can't cross the RSC serialization boundary.
 */
export default catchError(CardErrorFallback);
