import Link from 'next/link';
import { ViewTransition } from 'react';
import { CronotypeMark } from '@/components/cronotype-mark';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { GitHubIcon } from '@/components/ui/icons';

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
            <Link
              href="/types"
              className="text-ink/75 dark:text-paper/75 hover:text-ink dark:hover:text-paper inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors"
            >
              Types
            </Link>
            <Link
              href="/team"
              className="text-ink/75 dark:text-paper/75 hover:text-ink dark:hover:text-paper inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors"
            >
              Team
            </Link>
            <Link
              href="/private"
              className="text-ink/75 dark:text-paper/75 hover:text-ink dark:hover:text-paper hidden h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors sm:inline-flex"
            >
              Private
            </Link>
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
