import Link from 'next/link';
import { TeamBackLink } from '@/features/team/components/team-back-link';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function HandleLayout({ children }: Props) {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          &larr; Reveal another
        </Link>
        <TeamBackLink />
      </header>
      {children}
    </div>
  );
}
