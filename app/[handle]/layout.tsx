import { SmartBackLink } from '@/components/ui/smart-back-link';
import type { ReactNode } from 'react';
import type { Route } from 'next';

type Props = {
  children: ReactNode;
};

export default function HandleLayout({ children }: Props) {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SmartBackLink
          fallback={'/' as Route}
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          &larr; Reveal another
        </SmartBackLink>
      </header>
      {children}
    </div>
  );
}
