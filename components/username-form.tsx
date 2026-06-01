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

  const large = size === 'lg';

  return (
    <form onSubmit={submit} className={large ? 'flex w-full gap-2' : 'flex w-full gap-1.5'}>
      <label htmlFor="login" className="sr-only">
        GitHub username
      </label>
      <div
        className={
          large
            ? 'dark:bg-ink-2 flex flex-1 items-stretch overflow-hidden rounded-md border border-black/10 bg-white focus-within:border-black/40 dark:border-white/10 dark:focus-within:border-white/40'
            : 'dark:bg-ink-2 flex flex-1 items-stretch overflow-hidden rounded-md border border-black/10 bg-white dark:border-white/10'
        }
      >
        <span
          className={
            large
              ? 'text-muted dark:text-muted-dark flex items-center pr-1 pl-4 font-mono text-base'
              : 'text-muted dark:text-muted-dark flex items-center pr-1 pl-3 font-mono text-sm'
          }
        >
          @
        </span>
        <input
          id="login"
          name="login"
          type="text"
          placeholder="github-handle"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className={
            large
              ? 'placeholder-muted/50 dark:placeholder-muted-dark/50 dark:text-paper flex-1 border-0 bg-transparent px-1 py-3 text-base outline-none focus:ring-0'
              : 'placeholder-muted/50 dark:placeholder-muted-dark/50 dark:text-paper flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none focus:ring-0'
          }
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={
          large
            ? 'bg-ink text-paper dark:bg-paper dark:text-ink inline-flex shrink-0 items-center justify-center rounded-md px-5 text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50'
            : 'bg-ink text-paper dark:bg-paper dark:text-ink inline-flex shrink-0 items-center justify-center rounded-md px-4 text-xs font-medium transition-opacity hover:opacity-85 disabled:opacity-50'
        }
      >
        {pending ? '…' : 'Go'}
      </button>
    </form>
  );
}
