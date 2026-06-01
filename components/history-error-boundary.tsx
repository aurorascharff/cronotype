'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import { ProfileErrorCard } from '@/components/profile-error-card';

function HistoryErrorFallback(
  props: { title?: string; body?: string },
  { unstable_retry: retry }: ErrorInfo,
) {
  return (
    <ProfileErrorCard
      title={props.title ?? "We couldn't load this history right now."}
      body={props.body ?? 'Your main diagnosis is still visible. Try again to fetch the full timeline.'}
      onRetry={() => retry()}
      retryLabel="Try again"
      showHomeLink={false}
    />
  );
}

export default catchError(HistoryErrorFallback);
