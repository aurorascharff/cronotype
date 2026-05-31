import Link from 'next/link';
import { CronotypeMark } from '@/components/cronotype-mark';
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-paper/70 backdrop-blur-md dark:bg-ink/70">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <CronotypeMark size={22} />
          <span className="text-sm font-semibold tracking-tight">cronotype</span>
        </Link>
        <nav className="flex items-center gap-1">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
