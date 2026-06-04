'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Route } from 'next';

type Props = {
  children: ReactNode;
  className?: string;
  fallback: Route;
  referrerPathname?: string;
};

export function SmartBackLink({ children, className, fallback, referrerPathname }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (!referrerPathname && window.history.length > 1) {
          router.back();
          return;
        }

        if (document.referrer) {
          try {
            const referrer = new URL(document.referrer);
            const matchesPath = referrerPathname ? referrer.pathname === referrerPathname : true;
            if (referrer.origin === window.location.origin && matchesPath) {
              router.back();
              return;
            }
          } catch {
            // Fall through to the explicit in-app fallback.
          }
        }
        router.push(fallback);
      }}
    >
      {children}
    </button>
  );
}
