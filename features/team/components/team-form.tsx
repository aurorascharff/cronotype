'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { SyntheticEvent } from 'react';
import { parseTeamHandles, parseTeamName, teamUrl } from '@/features/team/team-handles';
import type { Route } from 'next';

export function TeamForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = parseTeamName(String(formData.get('name') ?? ''));
    const { handles } = parseTeamHandles(String(formData.get('handles') ?? ''));
    startTransition(() => {
      router.push(teamUrl({ handles, name }) as Route);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)_auto]"
      aria-busy={isPending}
    >
      <label className="sr-only" htmlFor="team-name">
        Team name
      </label>
      <input
        id="team-name"
        name="name"
        placeholder="Next.js team"
        className="dark:bg-ink-2 text-ink dark:text-paper placeholder:text-muted/60 dark:placeholder:text-muted-dark/60 h-11 min-w-0 rounded-lg border border-black/10 bg-white px-3 text-sm transition-colors outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
        spellCheck={false}
      />
      <label className="sr-only" htmlFor="team-handles">
        GitHub handles
      </label>
      <input
        id="team-handles"
        name="handles"
        placeholder="leerob, shadcn, rauchg, icyJoseph"
        className="dark:bg-ink-2 text-ink dark:text-paper placeholder:text-muted/60 dark:placeholder:text-muted-dark/60 h-11 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm transition-colors outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-on-brand dark:text-ink h-11 rounded-lg border border-cyan-300/60 px-4 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_1px_2px_rgba(0,0,0,0.20)] ring-1 ring-cyan-400/25 transition-[border-color,box-shadow] hover:border-cyan-200/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.46),0_4px_14px_rgba(6,182,212,0.20)] active:translate-y-px disabled:pointer-events-none disabled:opacity-60 dark:border-cyan-200/50 dark:ring-cyan-200/20"
      >
        Generate
      </button>
    </form>
  );
}
