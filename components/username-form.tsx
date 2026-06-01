'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

export function UsernameForm({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const [value, setValue] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function go(raw: string) {
    const login = raw.trim().replace(/^@/, '').replace(/\/+$/, '').toLowerCase();
    if (!login) {
      toast.error('Type a GitHub username.');
      return;
    }
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(login)) {
      toast.error("That doesn't look like a GitHub username.");
      return;
    }
    // Clear immediately so back-navigation lands on an empty field.
    setValue('');
    startTransition(() => {
      router.push(`/u/${login}`);
    });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    go(value);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // Cmd/Ctrl+Enter — some browsers don't submit forms on this combo, so
    // catch it here. Plain Enter is handled by native form submission.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      go(value);
    }
  }

  const large = size === 'lg';

  return (
    <form onSubmit={submit} onKeyDownCapture={onKeyDown} className="flex w-full gap-1.5" aria-busy={pending}>
      <label htmlFor="login" className="sr-only">
        GitHub username
      </label>
      <div
        className={
          large
            ? 'dark:bg-ink-2 flex flex-1 items-stretch overflow-hidden rounded-lg border border-black/10 bg-white transition-opacity focus-within:border-black/40 dark:border-white/10 dark:focus-within:border-white/40'
            : 'dark:bg-ink-2 flex flex-1 items-stretch overflow-hidden rounded-lg border border-black/10 bg-white transition-opacity dark:border-white/10'
        }
        style={{ opacity: pending ? 0.6 : 1 }}
      >
        <span
          className={
            large
              ? 'text-muted dark:text-muted-dark flex items-center pr-0.5 pl-3 font-mono text-sm'
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
          disabled={pending}
          className={
            large
              ? 'placeholder-muted/50 dark:placeholder-muted-dark/50 dark:text-paper flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none focus:ring-0'
              : 'placeholder-muted/50 dark:placeholder-muted-dark/50 dark:text-paper flex-1 border-0 bg-transparent px-1 py-1.5 text-sm outline-none focus:ring-0'
          }
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        aria-label="Reveal this developer"
        className={
          large
            ? 'bg-brand text-on-brand inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-[filter,opacity] hover:brightness-105 disabled:opacity-60'
            : 'bg-brand text-on-brand inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-[filter,opacity] hover:brightness-105 disabled:opacity-60'
        }
      >
        <span>Reveal</span>
      </button>
    </form>
  );
}
