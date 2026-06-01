import type { Archetype, ArchetypeId, ArchetypeTheme, HourStats } from '@/types/cronotype';

const THEMES: Record<ArchetypeId, ArchetypeTheme> = {
  drifter: { accent: '#94a3b8', accent2: '#cbd5e1', bgDark: '#08090b', bgLight: '#fafafa' },
  'insomniac-maintainer': { accent: '#ec4899', accent2: '#f472b6', bgDark: '#08090b', bgLight: '#fafafa' },
  'lunch-bandit': { accent: '#ef4444', accent2: '#f87171', bgDark: '#08090b', bgLight: '#fafafa' },
  'nine-to-fiver': { accent: '#06b6d4', accent2: '#22d3ee', bgDark: '#08090b', bgLight: '#fafafa' },
  'sunrise-sniper': { accent: '#f59e0b', accent2: '#fbbf24', bgDark: '#08090b', bgLight: '#fafafa' },
  'touch-grass': { accent: '#84cc16', accent2: '#a3e635', bgDark: '#08090b', bgLight: '#fafafa' },
  vampire: { accent: '#a855f7', accent2: '#c084fc', bgDark: '#08090b', bgLight: '#fafafa' },
  'weekend-warrior': { accent: '#10b981', accent2: '#34d399', bgDark: '#08090b', bgLight: '#fafafa' },
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  drifter: {
    id: 'drifter',
    name: 'Drifter',
    tagline: 'Your graph refuses to be predictable.',
    meaning: 'You code in stolen moments and still somehow keep shipping.',
    theme: THEMES.drifter,
  },
  'insomniac-maintainer': {
    id: 'insomniac-maintainer',
    name: 'Insomniac Maintainer',
    tagline: 'Two distinct peaks: business hours and late night.',
    meaning: 'A day job, plus a side project (or an on-call rotation) at night.',
    theme: THEMES['insomniac-maintainer'],
  },
  'lunch-bandit': {
    id: 'lunch-bandit',
    name: 'Lunch Bandit',
    tagline: 'You strike hardest when calendars say break time.',
    meaning: 'Your sharpest commits happen in that one sacred quiet hour.',
    theme: THEMES['lunch-bandit'],
  },
  'nine-to-fiver': {
    id: 'nine-to-fiver',
    name: 'Nine-to-Fiver',
    tagline: 'Structured rhythm. Consistent output. Professional tempo.',
    meaning: 'You ship clean during work hours and leave work at work.',
    theme: THEMES['nine-to-fiver'],
  },
  'sunrise-sniper': {
    id: 'sunrise-sniper',
    name: 'Sunrise Sniper',
    tagline: 'Commits land before most people open Slack.',
    meaning: 'You do your best work in the quiet before the world wakes up.',
    theme: THEMES['sunrise-sniper'],
  },
  'touch-grass': {
    id: 'touch-grass',
    name: 'Grass Toucher',
    tagline: 'Low public commit velocity in the recent window.',
    meaning: 'Either your life is balanced, or your best work is happening off-stage.',
    theme: THEMES['touch-grass'],
  },
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    tagline: 'Midnight to 4am is your golden hour.',
    meaning: 'You come alive when notifications sleep.',
    theme: THEMES.vampire,
  },
  'weekend-warrior': {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    tagline: 'Saturday and Sunday carry your velocity.',
    meaning: 'Your real momentum starts when the week is officially over.',
    theme: THEMES['weekend-warrior'],
  },
};

function midday(s: HourStats) {
  const total = s.total || 1;
  return ((s.hourly[12] ?? 0) / total) * 100;
}

export function classify(stats: HourStats): Archetype {
  if (stats.total < 25) return ARCHETYPES['touch-grass'];

  if (stats.pctNocturnal > 30) return ARCHETYPES.vampire;
  if (stats.pctSunrise > 25) return ARCHETYPES['sunrise-sniper'];

  const lunchSpike = midday(stats);
  const neighborAvg = (((stats.hourly[11] ?? 0) + (stats.hourly[13] ?? 0)) / 2 / (stats.total || 1)) * 100;
  if (lunchSpike > 8 && lunchSpike > neighborAvg * 1.6) return ARCHETYPES['lunch-bandit'];

  if (stats.pctWeekend > 40) return ARCHETYPES['weekend-warrior'];
  if (stats.isBimodal) return ARCHETYPES['insomniac-maintainer'];
  if (stats.pctBusiness > 70 && stats.hourlyVariance < 5) return ARCHETYPES['nine-to-fiver'];

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
