import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { ProfileCardSkeleton, ProfileCardSlot } from '@/features/leaderboard/components/profile-card-grid';
import { parseTeamHandles, serializeTeamHandles } from '@/features/team/team-handles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Build a shareable Cronotype gallery from a list of GitHub handles.',
  title: 'Team gallery',
};

export const unstable_prefetch = 'force-runtime';

export default function TeamPage({ searchParams }: PageProps<'/team'>) {
  return (
    <div className="space-y-10">
      <section className="space-y-5 pt-4 sm:pt-10">
        <h1 className="tracking-tightest mx-auto max-w-xl text-center text-2xl leading-tight font-semibold sm:text-4xl">
          Team gallery
        </h1>
        <p className="text-muted dark:text-muted-dark mx-auto max-w-md text-center text-sm">
          Add GitHub handles, share the URL, and keep the gallery cached with the same profile cards.
        </p>
        <form action="/team" className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="team-handles">
            GitHub handles
          </label>
          <input
            id="team-handles"
            name="handles"
            placeholder="leerob, shadcn, rauchg, icyJoseph"
            className="dark:bg-ink-2 text-ink dark:text-paper placeholder:text-muted/60 dark:placeholder:text-muted-dark/60 h-11 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm transition-colors outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
            spellCheck={false}
          />
          <button
            type="submit"
            className="bg-brand text-on-brand dark:text-ink h-11 rounded-lg border border-cyan-300/60 px-4 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_1px_2px_rgba(0,0,0,0.20)] ring-1 ring-cyan-400/25 transition-[border-color,box-shadow] hover:border-cyan-200/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.46),0_4px_14px_rgba(6,182,212,0.20)] active:translate-y-px dark:border-cyan-200/50 dark:ring-cyan-200/20"
          >
            Generate
          </button>
        </form>
      </section>
      <Suspense fallback={<TeamGallerySkeleton />}>
        <Crossfade>
          {searchParams.then(query => (
            <TeamGallery handlesParam={query.handles} />
          ))}
        </Crossfade>
      </Suspense>
    </div>
  );
}

function TeamGallery({ handlesParam }: { handlesParam: string | string[] | undefined }) {
  const { handles, invalid } = parseTeamHandles(handlesParam);
  const serialized = serializeTeamHandles(handles);

  if (handles.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Gallery</h2>
        <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-black/10 p-8 text-center text-sm dark:border-white/10">
          Add a few handles to make a team gallery.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Gallery</h2>
          {invalid.length > 0 && (
            <p className="text-muted dark:text-muted-dark text-xs">
              Skipped invalid handles: {invalid.map(handle => `@${handle}`).join(', ')}
            </p>
          )}
        </div>
        <a
          href={`/team/image?handles=${encodeURIComponent(serialized)}`}
          download="cronotype-team.png"
          className="text-muted dark:text-muted-dark dark:bg-ink-2 hover:text-ink dark:hover:text-paper inline-flex h-9 items-center justify-center rounded-lg border border-black/10 bg-white/60 px-3 text-xs font-semibold shadow-sm transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
        >
          Download image
        </a>
      </div>
      <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {handles.map(handle => (
          <li key={handle}>
            <ProfileCardSlot handle={handle} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TeamGallerySkeleton() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Gallery</h2>
      <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <ProfileCardSkeleton />
          </li>
        ))}
      </ul>
    </section>
  );
}
