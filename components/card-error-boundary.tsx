'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import type { ReactNode } from 'react';

type Props = { fallback: (retry: () => void) => ReactNode };

function CardErrorFallback({ fallback }: Props, { unstable_retry: retry }: ErrorInfo) {
  return fallback(() => retry());
}

/**
 * Compact retry boundary for individual card sub-fetches.
 *
 * The caller provides a render-prop fallback that receives the retry callback,
 * so the boundary works inline (tiny inline button, custom ring, etc.) without
 * the big ProfileErrorCard layout.
 */
export default catchError(CardErrorFallback);
