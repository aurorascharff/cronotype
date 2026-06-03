'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
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
  const shortLabel = partial ? 'Retry data' : 'Refresh';

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
      if (result.status === 'skipped') return;
      toast.success('History refreshed with the latest data GitHub returned.');
      router.replace(`/${handle.toLowerCase()}?history=1`, { scroll: false });
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      disabled={pending}
      isPending={pending}
      className="min-w-0 justify-start sm:min-w-32"
      icon={<RefreshCw className="h-2.5 w-2.5" />}
      iconPosition="start"
      onClick={refreshHistory}
      size="xs"
      variant="secondary"
    >
      <span className="inline-block text-left sm:min-w-24">
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{label}</span>
      </span>
    </Button>
  );
}
