'use client';

import { RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { SubmitButton } from '@/components/ui/button';
import { regenerateUserAndRedirect } from '@/features/profile/profile-actions';

type Props = {
  handle: string;
};

export function RegenerateButton({ handle }: Props) {
  const searchParams = useSearchParams();
  const showTimeline = searchParams.get('history') === '1';
  const action = regenerateUserAndRedirect.bind(null, handle, showTimeline);

  return (
    <form action={action}>
      <SubmitButton
        className="group/btn"
        icon={<RefreshCw className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:rotate-45" />}
        variant="secondary"
      >
        <span>Regenerate</span>
      </SubmitButton>
    </form>
  );
}
