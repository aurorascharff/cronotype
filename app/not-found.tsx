import Link from 'next/link';
import { UsernameForm } from '@/components/username-form';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
      <div className="border-border dark:border-border-dark dark:bg-ink-2/40 rounded-2xl border bg-white/60 p-10 text-center backdrop-blur-sm">
        <p className="text-muted dark:text-muted-dark mb-3 font-mono text-[11px] tracking-widest uppercase">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">Nothing here.</h1>
        <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md">
          But you came to the right place. Type a handle.
        </p>
        <div className="mx-auto mt-6 max-w-md">
          <UsernameForm size="md" />
        </div>
        <Link
          href="/"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper mt-4 inline-block font-mono text-xs tracking-widest uppercase transition-colors"
        >
          ← Back home
        </Link>
      </div>
    </main>
  );
}
