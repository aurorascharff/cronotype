import Link from 'next/link';
import { UsernameForm } from '@/components/username-form';

export default function NotFound() {
  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10">
      <h2 className="text-2xl font-semibold tracking-tight">That GitHub handle doesn&apos;t exist.</h2>
      <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md text-sm">
        Double-check the spelling, or try someone else.
      </p>
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
  );
}
