import Link from 'next/link';
import { UsernameForm } from '@/components/username-form';

export default function NotFound() {
  return (
    <div className="border-border dark:border-border-dark dark:bg-ink-2/40 rounded-2xl border bg-white/60 p-10 text-center backdrop-blur-sm">
      <p className="text-muted dark:text-muted-dark mb-3 font-mono text-[11px] tracking-widest uppercase">404</p>
      <h2 className="text-3xl font-semibold tracking-tight">That GitHub handle doesn&apos;t exist.</h2>
      <p className="text-muted dark:text-muted-dark mx-auto mt-3 max-w-md">
        Double-check the spelling. Or try someone else.
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
  );
}
