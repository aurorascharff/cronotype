'use client';

type Props = {
  title: string;
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ProfileErrorCard({ title, body, onRetry, retryLabel = 'Try again' }: Props) {
  return (
    <div className="dark:bg-ink-2 flex min-h-40 items-center justify-center rounded-xl border border-black/10 bg-white p-8 dark:border-white/10">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-muted dark:text-muted-dark max-w-sm text-sm">{body}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/[0.06]"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
