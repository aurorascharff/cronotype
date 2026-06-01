import Link from 'next/link';
import { UsernameForm } from '@/components/username-form';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
      <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10">
        <h1 className="text-3xl font-semibold tracking-tight">Nothing here.</h1>
        <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md text-sm">Type a GitHub handle to diagnose someone.</p>
        <div className="mx-auto mt-6 max-w-md">
          <UsernameForm size="md" />
        </div>
        <Link
          href="/"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper mt-4 inline-block text-sm transition-colors"
        >
          ← Back home
        </Link>
      </div>
    </main>
  );
}
