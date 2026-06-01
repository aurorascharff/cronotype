'use client';

import { useEffect } from 'react';
import { ProfileErrorCard } from '@/components/profile-error-card';

export default function ProfileErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[cronotype profile error]', error);
  }, [error]);

  return (
    <ProfileErrorCard
      title="We couldn't diagnose this developer."
      body="Their commit history might be private, or GitHub is being moody. Give it a minute and try again, or pick someone else."
      onRetry={reset}
    />
  );
}
