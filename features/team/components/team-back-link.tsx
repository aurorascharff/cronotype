'use client';

import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';
import {
  parseTeamRecents,
  recentTeamHref,
  TEAM_RECENTS_EVENT,
  TEAM_RECENTS_STORAGE_KEY,
} from '@/features/team/components/team-recents';

export function TeamBackLink() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, emptySnapshot);
  const team = useMemo(() => parseTeamRecents(snapshot)[0] ?? null, [snapshot]);

  if (!team) return null;

  return (
    <Link
      href={recentTeamHref(team)}
      className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper text-sm transition-colors"
    >
      &larr; Back to {team.name}
    </Link>
  );
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(TEAM_RECENTS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(TEAM_RECENTS_EVENT, onStoreChange);
  };
}

function readSnapshot() {
  return window.localStorage.getItem(TEAM_RECENTS_STORAGE_KEY) ?? '[]';
}

function emptySnapshot() {
  return '[]';
}
