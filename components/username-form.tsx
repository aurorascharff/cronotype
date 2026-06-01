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
    const login = value.trim().replace(/^@/, '').replace(/\/+$/, '').toLowerCase();
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
    <form onSubmit={submit} className="flex w-full gap-1.5">
      <label htmlFor="login" className="sr-only">
        GitHub username
      </label>
      <div
        className={
          large
            ? 'dark:bg-ink-2 flex flex-1 items-stretch overflow-hidden rounded-lg border border-black/10 bg-white focus-within:border-black/40 dark:border-white/10 dark:focus-within:border-white/40'
            : 'dark:bg-ink-2 flex flex-1 items-stretch overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/10'
        }
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
        aria-label="Diagnose this developer"
        className={
          large
            ? 'bg-brand text-on-brand inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-[filter,opacity] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70'
            : 'bg-brand text-on-brand inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-[filter,opacity] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70'
        }
      >
        <span>Diagnose</span>
        {pending ? (
          <span className="inline-flex" aria-hidden>
            <Spinner />
          </span>
        ) : null}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-label="Loading"
      role="img"
      className="animate-spin"
    >
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path
        d="M12.5 7a5.5 5.5 0 0 0-5.5-5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
