export function EvolutionStripSkeleton() {
  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
        <div className="flex items-center gap-2">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-5 w-24 rounded-md" />
        </div>
      </header>
      <div
        className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-4 sm:p-8 dark:border-white/10"
        aria-hidden
      >
        <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4">
          <li className="flex items-center gap-1.5">
            <span className="bg-muted/30 dark:bg-muted-dark/30 h-2 w-2 rounded-full" />
            <span className="skeleton h-3 w-20" />
          </li>
          <li className="flex items-center gap-1.5">
            <span className="bg-muted/30 dark:bg-muted-dark/30 h-2 w-2 rounded-full" />
            <span className="skeleton h-3 w-16" />
          </li>
          <li className="flex items-center gap-1.5">
            <span className="bg-muted/30 dark:bg-muted-dark/30 h-2 w-2 rounded-full" />
            <span className="skeleton h-3 w-24" />
          </li>
        </ul>

        <div className="relative h-32 sm:h-40">
          <div className="text-muted/60 dark:text-muted-dark/60 absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Spinner />
            <span className="text-[11px] font-medium tracking-wide uppercase">Loading, crunching your history</span>
          </div>
        </div>

        <div className="text-muted/60 dark:text-muted-dark/60 mt-2 flex justify-between text-[10px] tabular-nums">
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
          <span className="skeleton h-2.5 w-8" />
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-muted/40 dark:text-muted-dark/40 h-5 w-5 animate-spin"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
