import { UsernameForm } from '@/components/username-form';
import { RouteStateCard } from '@/features/profile/components/route-state-card';

export default function NotFound() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
      <RouteStateCard
        badge="GitHub not found"
        title="That user doesn't exist."
        body="GitHub didn't find a profile for that handle. Check the spelling, or try someone else."
        action={<UsernameForm size="md" />}
      />
    </section>
  );
}
