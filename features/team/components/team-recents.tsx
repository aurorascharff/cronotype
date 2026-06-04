'use client';

import Link from 'next/link';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { teamUrl } from '@/features/team/team-handles';
import type { Route } from 'next';

export type RecentTeam = {
  handles: string;
  name: string;
  savedAt: number;
  url: string;
};

export const TEAM_RECENTS_STORAGE_KEY = 'cronotype:recent-teams';
export const TEAM_RECENTS_EVENT = 'cronotype:recent-teams-updated';
const MAX_RECENTS = 5;

export function TeamRecents() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, emptySnapshot);
  const teams = useMemo(() => parseTeamRecents(snapshot), [snapshot]);

  if (teams.length === 0) return null;

  return (
    <section className="mx-auto max-w-2xl space-y-2">
      <h2 className="text-muted dark:text-muted-dark text-[11px] font-medium tracking-[0.14em] uppercase">
        Recent teams
      </h2>
      <div className="flex flex-wrap gap-2">
        {teams.map(team => (
          <Link
            key={recentTeamHref(team)}
            href={recentTeamHref(team)}
            className="dark:bg-ink-2 text-muted dark:text-muted-dark hover:text-ink dark:hover:text-paper inline-flex max-w-full items-center gap-2 rounded-lg border border-black/10 bg-white/70 px-2.5 py-1.5 text-xs transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
          >
            <span className="truncate font-medium">{team.name}</span>
            <span className="text-muted/60 dark:text-muted-dark/60 shrink-0">
              {team.handles.split(',').filter(Boolean).length}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TeamRecentSaver({ current }: { current?: { handles: string; name: string; url: string } }) {
  useEffect(() => {
    if (!current?.handles) return;
    const next: RecentTeam = {
      handles: current.handles,
      name: current.name || 'Untitled team',
      savedAt: Date.now(),
      url: current.url,
    };
    const existing = parseTeamRecents(readSnapshot()).filter(team => team.url !== next.url);
    writeTeams([next, ...existing].slice(0, MAX_RECENTS));
  }, [current]);

  return null;
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

export function parseTeamRecents(value: string): RecentTeam[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentTeam).slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export function recentTeamHref(team: RecentTeam): Route {
  const handles = team.handles
    .split(',')
    .map(handle => handle.trim())
    .filter(Boolean);
  const name = team.name === 'Untitled team' ? '' : team.name;
  return teamUrl({ handles, name }) as Route;
}

function isRecentTeam(value: unknown): value is RecentTeam {
  if (typeof value !== 'object' || value === null) return false;
  const team = value as Partial<RecentTeam>;
  return (
    typeof team.handles === 'string' &&
    typeof team.name === 'string' &&
    typeof team.savedAt === 'number' &&
    typeof team.url === 'string' &&
    team.url.startsWith('/team?')
  );
}

function writeTeams(teams: RecentTeam[]) {
  window.localStorage.setItem(TEAM_RECENTS_STORAGE_KEY, JSON.stringify(teams));
  window.dispatchEvent(new Event(TEAM_RECENTS_EVENT));
}
