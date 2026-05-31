import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-paper/70 backdrop-blur-md dark:bg-ink/70">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <span
            aria-hidden
            className="inline-flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-black text-white"
            style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
          >
            C
          </span>
          <span className="text-sm font-semibold tracking-tight">cronotype</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/leaderboard"
            className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper rounded-md px-3 py-1.5 text-sm transition-colors"
          >
            Leaderboard
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
