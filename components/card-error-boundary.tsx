'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import { ClassifyingRing } from '@/components/classifying-ring';

type Props = {
  variant: 'ring' | 'em-dash';
};

function CardErrorFallback({ variant }: Props, _info: ErrorInfo) {
  if (variant === 'ring') {
    return <ClassifyingRing failed />;
  }
  return <span className="text-muted/60 dark:text-muted-dark/60 truncate text-xs">—</span>;
}

export default catchError(CardErrorFallback);
