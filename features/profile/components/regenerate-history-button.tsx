'use client';

import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { regenerateHistory } from '@/features/profile/profile-actions';
import type { Route } from 'next';

type Props = {
  archetypeYearPage: number;
  archetypeYearRangeLabel: string | null;
  canRetry: boolean;
  failedArchetypeYears: number[];
  failedMonthlyYears: number[];
  handle: string;
  hasNewerArchetypeYears: boolean;
  hasOlderArchetypeYears: boolean;
  partial: boolean;
};

export function RegenerateHistoryButton({
  archetypeYearPage,
  archetypeYearRangeLabel,
  canRetry,
  failedArchetypeYears,
  failedMonthlyYears,
  handle,
  hasNewerArchetypeYears,
  hasOlderArchetypeYears,
  partial,
}: Props) {
  const router = useRouter();
  const [paging, startPaging] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const [pageDirection, setPageDirection] = useState<'newer' | 'older' | null>(null);
  const [retrying, setRetrying] = useState(false);

  function pageTo(page: number, direction: 'newer' | 'older') {
    setPageDirection(direction);
    startPaging(() => {
      const pageParam = page > 0 ? `&historyPage=${page}` : '';
      router.replace(`/${handle.toLowerCase()}?history=1${pageParam}` as Route, { scroll: false });
    });
  }

  async function refreshHistory() {
    if (retrying || paging) return;
    setRetrying(true);
    let result;
    try {
      result = await regenerateHistory(handle, failedMonthlyYears, failedArchetypeYears);
    } catch {
      toast.error('GitHub is rate-limited right now. Keeping the chart you already loaded.');
      setRetrying(false);
      return;
    }
    setRetrying(false);
    if (result.status === 'rate-limited') {
      toast.error('GitHub is rate-limited right now. Keeping the chart you already loaded.');
      return;
    }
    if (result.status === 'unchanged') {
      toast.message('GitHub did not return more history this time.');
      return;
    }
    toast.success('History refreshed with the latest data GitHub returned.');
    startRefresh(() => {
      router.refresh();
    });
  }

  const busy = paging || retrying || refreshing;
  const olderPending = paging && pageDirection === 'older';
  const newerPending = paging && pageDirection === 'newer';
  const retryPending = retrying || refreshing;

  return (
    <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div className="order-2 justify-self-start sm:order-none">
        {hasOlderArchetypeYears ? (
          <Button
            className="w-full sm:w-auto"
            type="button"
            disabled={busy}
            isPending={olderPending}
            icon={<ChevronLeft className="h-2.5 w-2.5" />}
            iconPosition="start"
            onClick={() => pageTo(archetypeYearPage + 1, 'older')}
            size="xs"
            variant="secondary"
          >
            Older
          </Button>
        ) : null}
      </div>
      <div className="order-1 col-span-2 flex min-w-0 flex-col items-center justify-center gap-2 text-center sm:order-none sm:col-span-1 sm:flex-row sm:flex-wrap">
        {archetypeYearRangeLabel ? (
          <span className="text-muted/70 dark:text-muted-dark/70 whitespace-nowrap text-[10.5px] tracking-wide uppercase">
            {archetypeYearRangeLabel}
          </span>
        ) : null}
        {canRetry ? (
          <Button
            className="max-w-full sm:w-auto"
            type="button"
            disabled={busy}
            isPending={retryPending}
            icon={<RefreshCw className="h-2.5 w-2.5" />}
            iconPosition="start"
            onClick={refreshHistory}
            size="xs"
            variant="secondary"
          >
            Retry missing years
          </Button>
        ) : null}
        {partial ? (
          <span className="text-muted/70 dark:text-muted-dark/70 whitespace-nowrap text-[10.5px] tracking-wide uppercase">
            Partial · GitHub rate limit
          </span>
        ) : null}
      </div>
      <div className="order-3 justify-self-end sm:order-none">
        {hasNewerArchetypeYears ? (
          <Button
            className="w-full sm:w-auto"
            type="button"
            disabled={busy}
            isPending={newerPending}
            icon={<ChevronRight className="h-2.5 w-2.5" />}
            iconPosition="end"
            onClick={() => pageTo(archetypeYearPage - 1, 'newer')}
            size="xs"
            variant="secondary"
          >
            Newer
          </Button>
        ) : null}
      </div>
      {!canRetry && !partial && !hasOlderArchetypeYears && !hasNewerArchetypeYears ? (
        <div className="order-4 col-span-2 justify-self-center sm:col-span-3">
          <Button
            type="button"
            disabled={busy}
            isPending={retryPending}
            icon={<RefreshCw className="h-2.5 w-2.5" />}
            iconPosition="start"
            onClick={refreshHistory}
            size="xs"
            variant="secondary"
          >
            Refresh
          </Button>
        </div>
      ) : null}
    </div>
  );
}
