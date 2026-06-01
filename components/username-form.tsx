'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { revealUser } from '@/features/profile/profile-actions';

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
    setValue('');
    startTransition(async () => {
      await revealUser(login);
      router.push(`/u/${login}`);
    });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    go(value);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // Cmd/Ctrl+Enter - some browsers don't submit forms on this combo, so
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
            ? 'bg-brand text-on-brand dark:text-ink group/btn ring-brand/20 hover:ring-brand/40 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold shadow-sm ring-1 transition-[filter,opacity,box-shadow] hover:brightness-105 disabled:opacity-60'
            : 'bg-brand text-on-brand dark:text-ink group/btn ring-brand/20 hover:ring-brand/40 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-sm ring-1 transition-[filter,opacity,box-shadow] hover:brightness-105 disabled:opacity-60'
        }
      >
        <span>Reveal</span>
        {pending ? <Spinner /> : <Arrow />}
      </button>
    </form>
  );
}

function Arrow() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
    >
      <path
        d="M2.5 6h7M6 2.5L9.5 6 6 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="animate-spin">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
      <path d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
