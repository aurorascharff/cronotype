import { UsernameForm } from '@/components/username-form';
import { RouteStateCard } from './route-state-card';

export default function NotFound() {
  return (
    <RouteStateCard
      badge="GitHub not found"
      title="That user doesn't exist."
      body="GitHub didn't find a profile for that handle. Check the spelling, or try someone else."
      action={<UsernameForm size="md" />}
    />
  );
}
