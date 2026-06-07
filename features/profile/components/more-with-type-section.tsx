import { notFound } from 'next/navigation';
import { LoadMore } from '@/components/ui/load-more';
import { ProfileCardSkeleton, ProfileCardSlot } from '@/features/leaderboard/components/profile-card-grid';
import { getFeaturedHandlesByType } from '@/features/leaderboard/leaderboard-queries';
import { computeCronotype, isGitHubNotFoundError } from '@/features/profile/profile-queries';
import type { ArchetypeId } from '@/types/cronotype';
import type { Route } from 'next';

type Props = {
  handle: string;
  load: boolean;
  href: Route;
};

export async function MoreWithTypeSection({ handle: rawHandle, load, href }: Props) {
  const handle = rawHandle.toLowerCase();

  if (!load) {
    return (
      <section className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">More with this type</h2>
        <LoadMore href={href}>Load matches</LoadMore>
      </section>
    );
  }

  let result;
  try {
    result = await computeCronotype(handle, '90d');
  } catch (err) {
    if (isGitHubNotFoundError(err)) notFound();
    throw err;
  }

  if (result.stats.total === 0) {
    return null;
  }

  const handles = await getFeaturedHandlesByType({
    excludeHandle: result.profile.login,
    typeId: result.archetype.id,
  });

  if (handles.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">More {TYPE_PLURALS[result.archetype.id]}</h2>
      </header>
      <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-4">
        {handles.map(handle => (
          <li key={handle}>
            <ProfileCardSlot handle={handle} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const TYPE_PLURALS: Record<ArchetypeId, string> = {
  drifter: 'Drifters',
  'insomniac-maintainer': 'Insomniac Maintainers',
  'last-call-shipper': 'Last Call Shippers',
  'lunch-bandit': 'Lunch Bandits',
  'nine-to-fiver': 'Nine-to-Fivers',
  'sunrise-sniper': 'Sunrise Snipers',
  'touch-grass': 'Grass Touchers',
  vampire: 'Vampires',
  'weekend-warrior': 'Weekend Warriors',
};

export function MoreWithTypeSectionSkeleton() {
  return (
    <section className="space-y-3" aria-hidden>
      <header className="flex items-center justify-between gap-3">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="skeleton h-8 w-28 rounded-lg" />
      </header>
      <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <li key={index}>
            <ProfileCardSkeleton />
          </li>
        ))}
      </ul>
    </section>
  );
}
