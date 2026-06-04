import { ClassifyingRing } from '@/components/ui/classifying-ring';
import type { ReactNode } from 'react';

type Props = {
  action?: ReactNode;
  badge: string;
  body: string;
  meta?: ReactNode;
  title: string;
  variant?: 'default' | 'error';
};

export function RouteStateCard({ action, badge, body, meta, title, variant = 'default' }: Props) {
  const isError = variant === 'error';

  return (
    <article className="dark:bg-ink-2 relative [aspect-ratio:auto] w-full overflow-hidden rounded-xl border border-black/10 bg-white sm:[aspect-ratio:1200/630] dark:border-white/10">
      <div className="text-ink/70 dark:text-paper/80 absolute top-3 right-3 z-10 rounded-lg border border-black/15 bg-white/95 px-2 py-1 font-mono text-[10px] tracking-wider uppercase backdrop-blur-sm sm:top-6 sm:right-6 dark:border-white/20 dark:bg-white/[0.10]">
        {badge}
      </div>

      <div className="grid h-full grid-cols-1 items-center gap-4 p-5 pt-11 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-8">
        <div className="relative mx-auto flex h-44 w-44 items-center justify-center opacity-85 min-[420px]:h-52 min-[420px]:w-52 sm:mx-0 sm:h-[220px] sm:w-[220px] sm:justify-start sm:pl-3">
          <div className="relative flex h-[140px] w-[140px] items-center justify-center sm:h-[220px] sm:w-[220px]">
            <ClassifyingRing failed variant="inset" />
            <div className="border-muted/20 dark:border-muted-dark/20 h-[44%] w-[44%] rounded-full border border-dashed" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="space-y-3">
            <p className="text-muted dark:text-muted-dark text-xs sm:text-sm">cronotype &middot; GitHub</p>
            <h1
              className={
                isError
                  ? 'text-muted dark:text-muted-dark text-sm font-medium break-words sm:text-base'
                  : 'tracking-tightest text-4xl leading-[0.98] font-semibold break-words min-[420px]:text-5xl sm:text-6xl'
              }
            >
              {title}
            </h1>
            <p
              className={
                isError
                  ? 'text-ink dark:text-paper max-w-xl text-2xl leading-tight font-semibold tracking-tight sm:text-4xl'
                  : 'text-muted dark:text-muted-dark max-w-md text-sm sm:text-base'
              }
            >
              {body}
            </p>
          </div>

          {(action || meta) && (
            <div className="flex max-w-md flex-wrap items-center gap-3">
              {action}
              {meta}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
