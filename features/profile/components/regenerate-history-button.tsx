'use client';

import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { regenerateHistory } from '@/features/profile/profile-actions';
import type { Route } from 'next';

type Props = {
  archetypeYearPage: number;
  failedArchetypeYears: number[];
  failedMonthlyYears: number[];
  handle: string;
  hasNewerArchetypeYears: boolean;
  hasOlderArchetypeYears: boolean;
  partial: boolean;
};

export function RegenerateHistoryButton({
  archetypeYearPage,
  failedArchetypeYears,
  failedMonthlyYears,
  handle,
  hasNewerArchetypeYears,
  hasOlderArchetypeYears,
  partial,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pageTo(page: number) {
    startTransition(() => {
      const pageParam = page > 0 ? `&historyPage=${page}` : '';
      router.replace(`/${handle.toLowerCase()}?history=1${pageParam}` as Route, { scroll: false });
      router.refresh();
    });
  }

  function refreshHistory() {
    startTransition(async () => {
      let result;
      try {
        result = await regenerateHistory(handle, failedMonthlyYears, failedArchetypeYears);
      } catch {
        toast.error('GitHub is rate-limited right now. Keeping the chart you already loaded.');
        return;
      }
      if (result.status === 'rate-limited') {
        toast.error('GitHub is rate-limited right now. Keeping the chart you already loaded.');
        return;
      }
      if (result.status === 'unchanged') {
        toast.message('GitHub did not return more history this time.');
        return;
      }
      toast.success('History refreshed with the latest data GitHub returned.');
      const pageParam = archetypeYearPage > 0 ? `&historyPage=${archetypeYearPage}` : '';
      router.replace(`/${handle.toLowerCase()}?history=1${pageParam}` as Route, { scroll: false });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {hasNewerArchetypeYears ? (
        <Button
          type="button"
          disabled={pending}
          isPending={pending}
          icon={<ChevronLeft className="h-2.5 w-2.5" />}
          iconPosition="start"
          onClick={() => pageTo(archetypeYearPage - 1)}
          size="xs"
          variant="secondary"
        >
          Newer
        </Button>
      ) : null}
      {partial ? (
        <Button
          type="button"
          disabled={pending}
          isPending={pending}
          icon={<RefreshCw className="h-2.5 w-2.5" />}
          iconPosition="start"
          onClick={refreshHistory}
          size="xs"
          variant="secondary"
        >
          Retry
        </Button>
      ) : null}
      {hasOlderArchetypeYears ? (
        <Button
          type="button"
          disabled={pending}
          isPending={pending}
          icon={<ChevronRight className="h-2.5 w-2.5" />}
          iconPosition="end"
          onClick={() => pageTo(archetypeYearPage + 1)}
          size="xs"
          variant="secondary"
        >
          Older
        </Button>
      ) : null}
      {!partial && !hasOlderArchetypeYears && !hasNewerArchetypeYears ? (
        <Button
          type="button"
          disabled={pending}
          isPending={pending}
          icon={<RefreshCw className="h-2.5 w-2.5" />}
          iconPosition="start"
          onClick={refreshHistory}
          size="xs"
          variant="secondary"
        >
          Refresh
        </Button>
      ) : null}
    </div>
  );
}
