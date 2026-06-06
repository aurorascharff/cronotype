'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';
import type { Route } from 'next';

export function LoadMore({ children = 'Load more', href }: { children?: ReactNode; href: Route }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      isPending={isPending}
      onClick={() => {
        startTransition(() => {
          router.push(href, { scroll: false });
        });
      }}
      variant="secondary"
    >
      {children}
    </Button>
  );
}
