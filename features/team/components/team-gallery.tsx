import { ProfileCardSkeleton, ProfileCardSlot } from '@/features/leaderboard/components/profile-card-grid';
import {
  parseTeamHandles,
  parseTeamName,
  serializeTeamHandles,
  teamImageUrl,
  teamUrl,
} from '@/features/team/team-handles';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { TeamRecentSaver } from './team-recents';

export function TeamContent({
  handlesParam,
  nameParam,
}: {
  handlesParam: string | string[] | undefined;
  nameParam: string | string[] | undefined;
}) {
  const { handles, invalid } = parseTeamHandles(handlesParam);
  const serialized = serializeTeamHandles(handles);
  const name = parseTeamName(nameParam);
  const url = teamUrl({ handles, name });
  const rawHandles = Array.isArray(handlesParam) ? handlesParam.join(',') : (handlesParam ?? '');
  const rawName = Array.isArray(nameParam) ? nameParam[0] : (nameParam ?? '');
  if ((serialized || name) && (rawHandles !== serialized || parseTeamName(rawName) !== name)) {
    redirect(url as Route);
  }
  const current = serialized ? { handles: serialized, name, url } : undefined;

  return (
    <>
      <TeamRecentSaver current={current} />
      <TeamGallery handles={handles} invalid={invalid} name={name} />
    </>
  );
}

function TeamGallery({ handles, invalid, name }: { handles: string[]; invalid: string[]; name: string }) {
  if (handles.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{name || 'Gallery'}</h2>
        <p className="text-muted dark:text-muted-dark rounded-xl border border-dashed border-black/10 p-8 text-center text-sm dark:border-white/10">
          Add a few handles to make a team gallery.
        </p>
      </section>
    );
  }

  const imageHref = teamImageUrl({ handles, name, variant: 'download' });

  return (
    <section className="space-y-4">
      <div className="grid min-h-16 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">{name || 'Gallery'}</h2>
          <p className="text-muted dark:text-muted-dark h-4 text-xs">
            {handles.length} {handles.length === 1 ? 'profile' : 'profiles'}
          </p>
          {invalid.length > 0 && (
            <p className="text-muted dark:text-muted-dark line-clamp-2 text-xs">
              Skipped invalid handles: {invalid.map(handle => `@${handle}`).join(', ')}
            </p>
          )}
        </div>
        <a
          href={imageHref}
          download="cronotype-team.png"
          className="text-muted dark:text-muted-dark dark:bg-ink-2 hover:text-ink dark:hover:text-paper inline-flex h-9 items-center justify-center rounded-lg border border-black/10 bg-white/60 px-3 text-xs font-semibold shadow-sm transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
        >
          Download image
        </a>
      </div>
      <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {handles.map(handle => (
          <li key={handle}>
            <ProfileCardSlot handle={handle} href={{ pathname: `/${handle}` }} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TeamGallerySkeleton() {
  return (
    <section className="space-y-4">
      <div className="grid min-h-16 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start" aria-hidden>
        <div className="min-w-0 space-y-1">
          <div className="skeleton h-7 w-44 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
        </div>
        <div className="skeleton hidden h-9 w-28 rounded-lg sm:block" />
      </div>
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
