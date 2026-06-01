'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { refreshPartialTimeline } from '@/features/profile/profile-actions';

type Props = {
  active: boolean;
  failedArchetypeYears?: number[];
  failedMonthlyYears?: number[];
  login: string;
};

export function PartialTimelineRefresh({ active, failedArchetypeYears = [], failedMonthlyYears = [], login }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!active) return null;

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await refreshPartialTimeline(login, failedMonthlyYears, failedArchetypeYears);
          router.refresh();
        })
      }
      disabled={isPending}
      className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper inline-flex min-w-24 items-center justify-center rounded-lg border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.06] dark:hover:bg-white/[0.12]"
    >
      {isPending ? 'Updating' : 'Update chart'}
    </button>
  );
}
