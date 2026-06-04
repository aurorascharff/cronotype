import Link from 'next/link';
import { ViewTransition } from 'react';
import type { ReactNode } from 'react';
import { CronotypeMark } from '@/components/cronotype-mark';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { GitHubIcon } from '@/components/ui/icons';
import type { Route } from 'next';

export function SiteHeader() {
  return (
    <ViewTransition name="site-header" default="none">
      <header className="bg-paper/70 dark:bg-ink/70 sticky top-0 z-40 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
            <CronotypeMark size={22} />
            <span className="text-sm font-semibold tracking-tight">cronotype</span>
          </Link>
          <nav className="flex items-center gap-1">
            <HeaderLink href="/types">Types</HeaderLink>
            <HeaderLink href="/team" emphasis>
              Team
            </HeaderLink>
            <HeaderLink href="/private" className="hidden sm:inline-flex">
              Private
            </HeaderLink>
            <a
              href="https://github.com/aurorascharff/cronotype"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="View source on GitHub"
              className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>
    </ViewTransition>
  );
}

function HeaderLink({
  children,
  className = '',
  emphasis = false,
  href,
}: {
  children: ReactNode;
  className?: string;
  emphasis?: boolean;
  href: Route;
}) {
  const base = 'inline-flex h-9 items-center rounded-lg border px-3 text-sm transition-colors';
  const variant = emphasis
    ? 'text-ink dark:text-paper border-black/10 bg-white/70 font-semibold shadow-sm hover:border-black/25 dark:border-white/10 dark:bg-white/[0.07] dark:hover:border-white/25'
    : 'text-ink/80 dark:text-paper/80 hover:text-ink dark:hover:text-paper border-transparent font-medium hover:border-black/10 hover:bg-white/55 dark:hover:border-white/10 dark:hover:bg-white/[0.06]';

  return (
    <Link href={href} className={`${base} ${variant} ${className}`}>
      {children}
    </Link>
  );
}
