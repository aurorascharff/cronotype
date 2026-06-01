type Props = {
  /** Show the failed state with a retry button. */
  failed?: boolean;
  /** Retry callback. Required when failed. */
  onRetry?: () => void;
  /** Diameter behavior: 'inset' (absolute inset-2) or 'fixed' (uses px size). */
  variant?: 'inset' | 'fixed';
  /** Used when variant='fixed'. */
  size?: number;
};

/**
 * Animated ring that signals "classifying in progress" without showing any data.
 * Falls back to a static dotted ring + retry button if classification failed.
 *
 * Used by both the leaderboard card skeleton and the hero card skeleton.
 */
export function ClassifyingRing({ failed = false, onRetry, variant = 'inset', size }: Props) {
  const positionClass = variant === 'inset' ? 'absolute inset-2' : '';
  const fixedStyle = variant === 'fixed' && size ? { height: size, width: size } : undefined;
  return (
    <>
      <span
        aria-label={failed ? 'Classification failed' : 'Classifying'}
        className={`${positionClass} rounded-full border-2 ${
          failed
            ? 'border-muted/20 dark:border-muted-dark/20 border-dotted'
            : 'border-muted/30 dark:border-muted-dark/30 animate-spin border-dashed opacity-70'
        }`}
        style={failed ? fixedStyle : { ...fixedStyle, animationDuration: '4s' }}
      />
      {failed && onRetry && (
        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onRetry();
          }}
          aria-label="Retry classification"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper absolute top-0 right-0 z-10 rounded-full border border-black/10 bg-white p-1 shadow-sm transition-colors dark:border-white/15 dark:bg-white/[0.08]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3" aria-hidden>
            <path d="M21 12a9 9 0 1 1-3.51-7.13" strokeLinecap="round" />
            <path d="M21 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  );
}
