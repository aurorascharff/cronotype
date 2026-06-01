'use client';

type Props = {
  title: string;
  body: string;
  onRetry?: () => void;
  isPending?: boolean;
  retryLabel?: string;
};

export function ProfileErrorCard({
  title,
  body,
  onRetry,
  isPending = false,
  retryLabel = 'Try again',
}: Props) {
  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md">{body}</p>
      {onRetry && (
        <div className="mt-6">
          <button
            onClick={onRetry}
            disabled={isPending}
            className="rounded-lg border border-black/10 bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/[0.06]"
          >
            {isPending ? 'Retrying…' : retryLabel}
          </button>
        </div>
      )}
    </div>
  );
}
