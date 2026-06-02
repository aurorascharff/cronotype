'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { revealUser } from '@/features/profile/profile-actions';

type Props = {
  handle: string;
};

export function RevealGate({ handle }: Props) {
  const [isWorking, setIsWorking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const busy = isWorking || isPending;

  function reveal() {
    if (busy) return;
    setIsWorking(true);
    startTransition(async () => {
      try {
        await revealUser(handle);
        router.replace(`/${handle.toLowerCase()}`);
        router.refresh();
      } catch {
        setIsWorking(false);
      }
    });
  }

  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10">
      <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
        <div className="min-w-0">
          <p className="text-ink dark:text-paper text-sm font-semibold break-words">
            {busy ? `Revealing @${handle}` : `Reveal @${handle}`}
          </p>
          <p className="text-muted dark:text-muted-dark mt-1 text-sm">
            {busy
              ? 'Fetching GitHub activity, caching the profile, and preparing the card.'
              : 'This profile has not been generated here yet.'}
          </p>
        </div>
        <Button
          type="button"
          onClick={reveal}
          disabled={busy}
          aria-busy={busy}
          className="h-10 shrink-0 px-4 text-sm"
          icon={busy ? <Spinner /> : null}
          iconPosition="start"
          variant="primary"
        >
          <span>{busy ? 'Revealing' : 'Reveal'}</span>
        </Button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="animate-spin">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
      <path d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
