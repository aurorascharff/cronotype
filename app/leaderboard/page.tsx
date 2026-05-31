import { BucketColumn } from '@/features/leaderboard/components/bucket-column';
import { PopularLeaderboard } from '@/features/leaderboard/components/popular-leaderboard';
import type { Bucket } from '@/features/leaderboard/leaderboard-queries';

export const unstable_prefetch = 'force-runtime';

const BUCKETS: Array<{ id: Bucket; title: string; subtitle: string }> = [
  { id: 'nocturnal', subtitle: 'Highest % of commits between midnight–4am', title: 'Most nocturnal' },
  { id: 'sunrise', subtitle: 'Earliest risers, between 5–8am', title: 'Dawn patrol' },
  { id: 'disciplined', subtitle: 'Tight 9–6 distribution, lowest variance', title: 'Most 9-to-5' },
  { id: 'weekend', subtitle: 'Worst weekend offenders', title: 'No off-days' },
];

export default function LeaderboardPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Leaderboards</h1>
        <p className="text-muted dark:text-muted-dark max-w-prose">
          Anyone who&apos;s been diagnosed shows up here.
        </p>
      </header>

      <PopularLeaderboard />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">By archetype</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {BUCKETS.map(bucket => (
            <BucketColumn key={bucket.id} bucket={bucket} />
          ))}
        </div>
      </section>
    </div>
  );
}
