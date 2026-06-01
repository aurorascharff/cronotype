'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const REFRESH_INTERVAL_MS = 60_000;
const MAX_REFRESHES = 8;

type Props = {
  active: boolean;
};

export function PartialTimelineRefresh({ active }: Props) {
  const router = useRouter();
  const refreshes = useRef(0);

  useEffect(() => {
    if (!active) return;

    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      if (refreshes.current >= MAX_REFRESHES) {
        window.clearInterval(id);
        return;
      }

      refreshes.current += 1;
      router.refresh();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [active, router]);

  return null;
}
