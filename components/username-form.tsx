'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

export function UsernameForm({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const [value, setValue] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const login = value.trim().replace(/^@/, '').replace(/\/+$/, '');
    if (!login) {
      toast.error('Type a GitHub username.');
      return;
    }
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(login)) {
      toast.error("That doesn't look like a GitHub username.");
      return;
    }
    startTransition(() => {
      router.push(`/u/${login}`);
    });
  }

  return (
    <form onSubmit={submit} className="w-full">
      <label htmlFor="login" className="sr-only">
        GitHub username
      </label>
      <div
        className={
          size === 'lg'
            ? 'border-border dark:border-border-dark dark:bg-ink-2 focus-within:ring-vampire/40 flex items-stretch overflow-hidden rounded-xl border bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.15)] focus-within:ring-2 dark:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]'
            : 'border-border dark:border-border-dark dark:bg-ink-2 flex items-stretch overflow-hidden rounded-md border bg-white'
        }
      >
        <span
          className={
            size === 'lg'
              ? 'text-muted dark:text-muted-dark flex items-center pr-1 pl-5 text-xl font-mono'
              : 'text-muted dark:text-muted-dark flex items-center pr-1 pl-3 text-sm font-mono'
          }
        >
          @
        </span>
        <input
          id="login"
          name="login"
          type="text"
          placeholder={size === 'lg' ? 'your-github-handle' : 'github-handle'}
          value={value}
          onChange={e => setValue(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className={
            size === 'lg'
              ? 'placeholder-muted/60 dark:placeholder-muted-dark/60 dark:text-paper flex-1 border-0 bg-transparent px-1 py-4 text-xl tracking-tight outline-none focus:ring-0'
              : 'placeholder-muted/60 dark:placeholder-muted-dark/60 dark:text-paper flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none focus:ring-0'
          }
        />
        <button
          type="submit"
          disabled={pending}
          className={
            size === 'lg'
              ? 'bg-ink text-paper dark:bg-paper dark:text-ink m-2 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50'
              : 'bg-ink text-paper dark:bg-paper dark:text-ink m-1 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-85 disabled:opacity-50'
          }
        >
          {pending ? '…' : 'Diagnose'}
        </button>
      </div>
    </form>
  );
}
