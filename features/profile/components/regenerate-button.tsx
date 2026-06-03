'use client';

import { RefreshCw } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { SubmitButton } from '@/components/ui/button';
import { regenerateUserAndRedirect } from '@/features/profile/profile-actions';

type Props = {
  handle: string;
};

export function RegenerateButton({ handle }: Props) {
  const searchParams = useSearchParams();
  const showTimeline = searchParams.get('history') === '1';
  // TODO(nextjs): keep this as an error recovery action until cached RSC reads
  // stop intermittently closing the connection after a successful regenerate.
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

export function RegenerateFromParamsButton() {
  const params = useParams<{ handle?: string | string[] }>();
  const rawHandle = params.handle;
  const handle = Array.isArray(rawHandle) ? rawHandle[0] : rawHandle;
  return handle ? <RegenerateButton handle={handle} /> : null;
}
