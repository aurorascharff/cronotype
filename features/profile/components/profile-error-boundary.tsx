'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import { ClassifyingRing } from '@/components/ui/classifying-ring';

type Props = {
  title?: string;
  body?: string;
  variant?: 'profile' | 'timeline';
};

function InlineErrorFallback(props: Props, _info: ErrorInfo) {
  const title = props.title ?? 'Something went wrong.';
  const body = props.body ?? 'Try again later.';
  return props.variant === 'timeline' ? (
    <TimelineErrorCard title={title} body={body} />
  ) : (
    <ProfileErrorCard title={title} body={body} />
  );
}

export default catchError(InlineErrorFallback);

function ProfileErrorCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="dark:bg-ink-2 relative [aspect-ratio:auto] w-full overflow-hidden rounded-xl border border-black/10 bg-white sm:[aspect-ratio:1200/630] dark:border-white/10">
      <div className="text-ink/70 dark:text-paper/80 absolute top-3 right-3 z-10 rounded-lg border border-black/15 bg-white/95 px-2 py-1 font-mono text-[10px] tracking-wider uppercase backdrop-blur-sm sm:top-6 sm:right-6 dark:border-white/20 dark:bg-white/[0.10]">
        GitHub paused
      </div>

      <div className="grid h-full grid-cols-1 items-center gap-4 p-5 pt-11 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
        <div className="relative mx-auto flex h-44 w-44 items-center justify-center opacity-85 min-[420px]:h-52 min-[420px]:w-52 sm:mx-0 sm:h-[220px] sm:w-[220px] sm:justify-start sm:pl-3">
          <div className="relative flex h-[140px] w-[140px] items-center justify-center sm:h-[220px] sm:w-[220px]">
            <ClassifyingRing failed variant="inset" />
            <div className="border-muted/20 dark:border-muted-dark/20 h-[44%] w-[44%] rounded-full border border-dashed" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-muted dark:text-muted-dark text-xs sm:text-sm">cronotype · GitHub</p>
          <h1 className="tracking-tightest text-4xl leading-[0.98] font-semibold break-words min-[420px]:text-5xl sm:text-6xl">
            {title}
          </h1>
          <p className="text-muted dark:text-muted-dark max-w-md text-sm sm:text-base">{body}</p>
        </div>
      </div>
    </article>
  );
}

function TimelineErrorCard({ title, body }: { title: string; body: string }) {
  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold tracking-tight">How you got here</h2>
        <span className="text-muted/70 dark:text-muted-dark/70 text-[10.5px] tracking-wide uppercase">
          GitHub rate limit
        </span>
      </header>
      <div className="dark:bg-ink-2 flex h-40 items-center justify-center rounded-xl border border-black/10 bg-white p-6 text-center dark:border-white/10">
        <div className="flex max-w-sm flex-col items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <p className="text-muted dark:text-muted-dark text-sm">{body}</p>
        </div>
      </div>
    </>
  );
}
