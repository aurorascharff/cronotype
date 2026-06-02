'use client';

import { ArrowRight } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
      <Button
        type="submit"
        disabled={busy}
        aria-label="Reveal this developer"
        className={large ? 'group/btn shrink-0 px-4 text-sm' : 'group/btn shrink-0 px-3 text-xs'}
        icon={<ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />}
        isPending={busy}
        variant="primary"
      >
        <span>Reveal</span>
      </Button>
    </form>
  );
}
