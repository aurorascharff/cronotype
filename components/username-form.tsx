'use client';

import { useActionState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { revealUserFromForm } from '@/features/profile/profile-actions';

export function UsernameForm({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isSubmitting] = useActionState(revealUserFromForm, { error: null, errorId: 0 });
  const busy = isSubmitting;

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error, state.errorId]);

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // Cmd/Ctrl+Enter - some browsers don't submit forms on this combo, so
    // catch it here. Plain Enter is handled by native form submission.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      formRef.current?.requestSubmit();
    }
  }

  const large = size === 'lg';

  return (
    <form
      ref={formRef}
      action={formAction}
      onKeyDownCapture={onKeyDown}
      className="flex w-full gap-1.5"
      aria-busy={busy}
    >
      <label htmlFor="handle" className="sr-only">
        GitHub username
      </label>
      <div
        className={
          large
            ? 'dark:bg-ink-2 flex flex-1 items-stretch overflow-hidden rounded-lg border border-black/10 bg-white transition-opacity focus-within:border-black/40 dark:border-white/10 dark:focus-within:border-white/40'
            : 'dark:bg-ink-2 flex flex-1 items-stretch overflow-hidden rounded-lg border border-black/10 bg-white transition-opacity dark:border-white/10'
        }
        style={{ opacity: busy ? 0.6 : 1 }}
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
          id="handle"
          name="handle"
          type="text"
          placeholder="github-handle"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={busy}
          className={
            large
              ? 'placeholder-muted/50 dark:placeholder-muted-dark/50 dark:text-paper flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none focus:ring-0'
              : 'placeholder-muted/50 dark:placeholder-muted-dark/50 dark:text-paper flex-1 border-0 bg-transparent px-1 py-1.5 text-sm outline-none focus:ring-0'
          }
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        aria-label="Reveal this developer"
        className={
          large
            ? 'bg-brand text-on-brand dark:text-ink group/btn ring-brand/20 hover:ring-brand/40 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold shadow-sm ring-1 transition-[filter,opacity,box-shadow] hover:brightness-105 disabled:opacity-60'
            : 'bg-brand text-on-brand dark:text-ink group/btn ring-brand/20 hover:ring-brand/40 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-sm ring-1 transition-[filter,opacity,box-shadow] hover:brightness-105 disabled:opacity-60'
        }
      >
        <span>{busy ? 'Revealing' : 'Reveal'}</span>
        {busy ? <Spinner /> : <Arrow />}
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
