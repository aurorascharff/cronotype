'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import { useTransition } from 'react';
import { ProfileErrorCard } from '@/components/profile-error-card';

type Props = {
  title?: string;
  body?: string;
  retryLabel?: string;
};

function InlineErrorFallback(props: Props, { unstable_retry: retry }: ErrorInfo) {
  const [isPending, startTransition] = useTransition();

  return (
    <ProfileErrorCard
      title={props.title ?? 'Something went wrong.'}
      body={props.body ?? 'Try again to refetch.'}
      onRetry={() => startTransition(() => retry())}
      isPending={isPending}
      retryLabel={props.retryLabel ?? 'Try again'}
    />
  );
}

export default catchError(InlineErrorFallback);
