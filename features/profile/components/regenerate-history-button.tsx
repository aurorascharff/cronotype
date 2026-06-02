'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { regenerateHistory } from '@/features/profile/profile-actions';

type Props = {
  failedArchetypeYears: number[];
  failedMonthlyYears: number[];
  handle: string;
  partial: boolean;
};

export function RegenerateHistoryButton({ failedArchetypeYears, failedMonthlyYears, handle, partial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const label = partial ? 'Retry missing data' : 'Refresh history';

  function refreshHistory() {
    startTransition(async () => {
      await regenerateHistory(handle, failedMonthlyYears, failedArchetypeYears);
      router.replace(`/${handle.toLowerCase()}?history=1`, { scroll: false });
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className="min-w-32 justify-start"
      icon={pending ? <Spinner /> : <RefreshIcon />}
      iconPosition="start"
      onClick={refreshHistory}
      size="xs"
      variant="secondary"
    >
      <span className="inline-block min-w-24 text-left">{pending ? 'Refreshing' : label}</span>
    </Button>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-2.5 w-2.5"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-3.51-7.13" />
      <path d="M21 4v6h-6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden className="animate-spin">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
      <path d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
