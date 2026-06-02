'use client';

import { unstable_catchError as catchError, type ErrorInfo } from 'next/error';
import type { ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  situation: string;
  title: string;
};

function ErrorFallback(props: ErrorBoundaryProps, _info: ErrorInfo) {
  return props.fallback ?? <DefaultErrorFallback title={props.title} situation={props.situation} />;
}

export const ErrorBoundary = catchError(ErrorFallback);

function DefaultErrorFallback({ title, situation }: { title: string; situation: string }) {
  return (
    <div className="dark:bg-ink-2 flex min-h-36 items-center justify-center rounded-xl border border-black/10 bg-white p-6 text-center dark:border-white/10">
      <div className="flex max-w-sm flex-col items-center gap-2">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-muted dark:text-muted-dark text-sm">{situation}</p>
      </div>
    </div>
  );
}
