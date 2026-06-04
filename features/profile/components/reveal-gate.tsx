'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/ui/button';
import { revealUserFromGate } from '@/features/profile/profile-actions';

type Props = {
  handle: string;
};

export function RevealGate({ handle }: Props) {
  const [state, formAction, isSubmitting] = useActionState(revealUserFromGate, {
    error: null,
    errorId: 0,
  });

  return (
    <form
      action={formAction}
      className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10"
    >
      <input type="hidden" name="handle" value={handle} />
      <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
        <div className="min-w-0">
          <p className="text-ink dark:text-paper text-sm font-semibold break-words">
            {isSubmitting ? `Revealing @${handle}` : `Reveal @${handle}`}
          </p>
          <p className="text-muted dark:text-muted-dark mt-1 text-sm">
            {isSubmitting
              ? 'Fetching GitHub activity, caching the profile, and preparing the card.'
              : 'This profile has not been generated here yet.'}
          </p>
          {state.error ? (
            <p key={state.errorId} className="mt-2 text-sm font-medium text-red-600 dark:text-red-300" role="status">
              {state.error}
            </p>
          ) : null}
        </div>
        <SubmitButton className="h-10 shrink-0 px-4 text-sm" iconPosition="start" variant="primary">
          <span>{isSubmitting ? 'Revealing' : 'Reveal'}</span>
        </SubmitButton>
      </div>
    </form>
  );
}
