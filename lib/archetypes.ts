import type { Archetype, ArchetypeId, ArchetypeTheme, HourStats } from '@/types/cronotype';

const THEMES: Record<ArchetypeId, ArchetypeTheme> = {
  drifter: { accent: '#60a5fa', accent2: '#93c5fd', bgDark: '#08090b', bgLight: '#fafafa' },
  'insomniac-maintainer': { accent: '#ec4899', accent2: '#f472b6', bgDark: '#08090b', bgLight: '#fafafa' },
  'lunch-bandit': { accent: '#ef4444', accent2: '#f87171', bgDark: '#08090b', bgLight: '#fafafa' },
  'nine-to-fiver': { accent: '#06b6d4', accent2: '#22d3ee', bgDark: '#08090b', bgLight: '#fafafa' },
  'sunrise-sniper': { accent: '#f59e0b', accent2: '#fbbf24', bgDark: '#08090b', bgLight: '#fafafa' },
  'touch-grass': { accent: '#84cc16', accent2: '#a3e635', bgDark: '#08090b', bgLight: '#fafafa' },
  vampire: { accent: '#a855f7', accent2: '#c084fc', bgDark: '#08090b', bgLight: '#fafafa' },
  'weekend-warrior': { accent: '#10b981', accent2: '#34d399', bgDark: '#08090b', bgLight: '#fafafa' },
};

export const QUIET_THEME: ArchetypeTheme = {
  accent: '#9ca3af',
  accent2: '#d1d5db',
  bgDark: '#08090b',
  bgLight: '#fafafa',
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  drifter: {
    id: 'drifter',
    name: 'Drifter',
    tagline: 'Hard to pin down, harder to stop.',
    meaning: 'You move through odd windows, bursts, and gaps, yet the work keeps appearing.',
    theme: THEMES.drifter,
  },
  'insomniac-maintainer': {
    id: 'insomniac-maintainer',
    name: 'Insomniac Maintainer',
    tagline: 'Daylight duties, midnight merge energy.',
    meaning: 'You split your output between the official day and the second shift after everyone logs off.',
    theme: THEMES['insomniac-maintainer'],
  },
  'lunch-bandit': {
    id: 'lunch-bandit',
    name: 'Lunch Bandit',
    tagline: 'Your calendar says break. Your commit log disagrees.',
    meaning: 'You turn the quiet middle of the day into a tiny shipping heist.',
    theme: THEMES['lunch-bandit'],
  },
  'nine-to-fiver': {
    id: 'nine-to-fiver',
    name: 'Nine-to-Fiver',
    tagline: 'Calendar-friendly, suspiciously consistent.',
    meaning: 'You keep a steady workday pulse and still make it look clean.',
    theme: THEMES['nine-to-fiver'],
  },
  'sunrise-sniper': {
    id: 'sunrise-sniper',
    name: 'Sunrise Sniper',
    tagline: 'You ship before the standup has coffee.',
    meaning: 'You find leverage in the early quiet and leave fresh commits for everyone else to wake up to.',
    theme: THEMES['sunrise-sniper'],
  },
  'touch-grass': {
    id: 'touch-grass',
    name: 'Grass Toucher',
    tagline: 'Low public signal, high possibility.',
    meaning: 'You are either touching grass, building somewhere private, or letting the graph wonder where you went.',
    theme: THEMES['touch-grass'],
  },
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    tagline: 'The repo wakes up after midnight.',
    meaning: 'You do your sharpest work when notifications are asleep and the world stops asking questions.',
    theme: THEMES.vampire,
  },
  'weekend-warrior': {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    tagline: 'The week ends. Your graph clocks in.',
    meaning: 'You turn Saturday and Sunday into the part of the week where momentum finally gets room.',
    theme: THEMES['weekend-warrior'],
  },
};

function midday(s: HourStats) {
  const total = s.total || 1;
  return ((s.hourly[12] ?? 0) / total) * 100;
}

function hasLunchSpike(s: HourStats) {
  const lunchSpike = midday(s);
  const neighborAvg = (((s.hourly[11] ?? 0) + (s.hourly[13] ?? 0)) / 2 / (s.total || 1)) * 100;
  return lunchSpike > 8 && lunchSpike > neighborAvg * 1.6;
}

function isWorkdayRhythm(s: HourStats) {
  return s.pctBusiness > 70 && s.pctNocturnal < 15 && s.pctWeekend < 35;
}

export function classify(stats: HourStats): Archetype {
  if (stats.total < 25) return ARCHETYPES['touch-grass'];

  if (stats.isBimodal) return ARCHETYPES['insomniac-maintainer'];
  if (stats.pctNocturnal > 30) return ARCHETYPES.vampire;
  if (stats.pctSunrise > 25) return ARCHETYPES['sunrise-sniper'];
  if (hasLunchSpike(stats)) return ARCHETYPES['lunch-bandit'];
  if (stats.pctWeekend > 40) return ARCHETYPES['weekend-warrior'];
  if (isWorkdayRhythm(stats)) return ARCHETYPES['nine-to-fiver'];

  return ARCHETYPES.drifter;
}

export function percentileFor(archetype: Archetype, stats: HourStats): number {
  switch (archetype.id) {
    case 'vampire':
      return clampPct(stats.pctNocturnal * 2);
    case 'sunrise-sniper':
      return clampPct(stats.pctSunrise * 2.5);
    case 'lunch-bandit':
      return clampPct(midday(stats) * 6);
    case 'weekend-warrior':
      return clampPct(stats.pctWeekend * 1.5);
    case 'nine-to-fiver':
      return clampPct(stats.pctBusiness * 1.1);
    case 'insomniac-maintainer':
      return clampPct(50 + stats.pctNocturnal);
    case 'touch-grass':
      return clampPct(100 - stats.total);
    default:
      return 50;
  }
}

function clampPct(n: number) {
  return Math.max(1, Math.min(99, Math.round(n)));
}
