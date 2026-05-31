import { PopularLeaderboard } from '@/features/leaderboard/components/popular-leaderboard';
import { UsernameForm } from '@/components/username-form';

export const unstable_prefetch = 'force-runtime';

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-24">
      <section className="space-y-8 pt-8 sm:pt-16">
        <div className="space-y-5 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl leading-[1] font-semibold tracking-tightest sm:text-6xl">
            What kind of developer
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
            >
              are you, really?
            </span>
          </h1>
          <p className="text-muted dark:text-muted-dark mx-auto max-w-md text-base sm:text-lg">
            Type your GitHub handle. Get a verdict.
          </p>
        </div>

        <div className="mx-auto max-w-xl">
          <UsernameForm />
        </div>
      </section>

      <PopularLeaderboard />
    </div>
  );
}
