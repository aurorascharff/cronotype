import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { isValidGitHubHandle } from '@/lib/github-handle';
import { hasBeenRevealed, hasTimelineLoaded } from '@/lib/reveals';
import { EvolutionStrip } from './evolution-strip';
import { TimelinePrompt } from './timeline-prompt';

type Props = {
  handle: string;
  showTimeline: boolean;
};

export async function ProfileHistorySection({ handle: rawHandle, showTimeline }: Props) {
  const handle = rawHandle.toLowerCase();
  if (!isValidGitHubHandle(handle)) notFound();

  await connection();
  const revealed = await hasBeenRevealed(handle);
  if (!revealed) return null;

  const shouldShowTimeline = showTimeline || (await hasTimelineLoaded(handle));
  if (!shouldShowTimeline) return <TimelinePrompt handle={handle} />;

  const errorTitle = "We couldn't load this history right now.";
  const errorSituation = 'GitHub is rate-limited right now. Give it a minute and try again.';

  return (
    <section className="space-y-4">
      <ErrorBoundary
        title={errorTitle}
        situation={errorSituation}
        fallback={<TimelineErrorCard title={errorTitle} situation={errorSituation} />}
      >
        <EvolutionStrip handle={handle} />
      </ErrorBoundary>
    </section>
  );
}

function TimelineErrorCard({ title, situation }: { title: string; situation: string }) {
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
          <p className="text-muted dark:text-muted-dark text-sm">{situation}</p>
        </div>
      </div>
    </>
  );
}
