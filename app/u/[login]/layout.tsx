import Link from 'next/link';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-10">
      <header>
        <Link
          href="/"
          className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
        >
          ← Diagnose another
        </Link>
      </header>
      <div className="space-y-10">{children}</div>
    </div>
  );
}
