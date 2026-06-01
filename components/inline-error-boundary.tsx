'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import { ProfileErrorCard } from '@/components/profile-error-card';

type Props = {
  title?: string;
  body?: string;
};

function InlineErrorFallback(props: Props, _info: ErrorInfo) {
  return <ProfileErrorCard title={props.title ?? 'Something went wrong.'} body={props.body ?? 'Try again later.'} />;
}

export default catchError(InlineErrorFallback);
