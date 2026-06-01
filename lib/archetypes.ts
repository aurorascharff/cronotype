import type { Archetype, ArchetypeId, ArchetypeTheme, HourStats } from '@/types/cronotype';

/**
 * Each archetype gets its own accent. Picked for type-meaning (vampires are
 * purple, sunrise is amber, etc.) but kept at consistent saturation so the
 * brand still reads as one design system.
 */
const THEMES: Record<ArchetypeId, ArchetypeTheme> = {
  drifter: { accent: '#94a3b8', accent2: '#cbd5e1', bgDark: '#08090b', bgLight: '#fafafa' }, // slate
  'insomniac-maintainer': { accent: '#ec4899', accent2: '#f472b6', bgDark: '#08090b', bgLight: '#fafafa' }, // pink
  'lunch-bandit': { accent: '#ef4444', accent2: '#f87171', bgDark: '#08090b', bgLight: '#fafafa' }, // red
  'nine-to-fiver': { accent: '#06b6d4', accent2: '#22d3ee', bgDark: '#08090b', bgLight: '#fafafa' }, // cyan
  'sunrise-sniper': { accent: '#f59e0b', accent2: '#fbbf24', bgDark: '#08090b', bgLight: '#fafafa' }, // amber
  'touch-grass': { accent: '#84cc16', accent2: '#a3e635', bgDark: '#08090b', bgLight: '#fafafa' }, // lime
  vampire: { accent: '#a855f7', accent2: '#c084fc', bgDark: '#08090b', bgLight: '#fafafa' }, // purple
  'weekend-warrior': { accent: '#10b981', accent2: '#34d399', bgDark: '#08090b', bgLight: '#fafafa' }, // emerald
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  drifter: {
    id: 'drifter',
    name: 'Drifter',
    tagline: 'No clear pattern. Commits scattered across the day.',
    meaning: 'You work whenever you can. Probably context-switching a lot.',
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
    tagline: 'Disproportionate spike between noon and 1pm.',
    meaning: 'Your best focus block is when nobody is messaging you.',
    theme: THEMES['lunch-bandit'],
  },
  'nine-to-fiver': {
    id: 'nine-to-fiver',
    name: 'Nine-to-Fiver',
    tagline: 'Tight distribution between 9am and 6pm. Low variance.',
    meaning: 'You treat coding like a job. Boundaries intact.',
    theme: THEMES['nine-to-fiver'],
  },
  'sunrise-sniper': {
    id: 'sunrise-sniper',
    name: 'Sunrise Sniper',
    tagline: 'Most commits land between 5am and 8am.',
    meaning: 'You ship before the rest of your team is awake.',
    theme: THEMES['sunrise-sniper'],
  },
  'touch-grass': {
    id: 'touch-grass',
    name: 'Grass Toucher',
    tagline: 'Low commit volume in the last 90 days.',
    meaning: 'You have a life, or you commit somewhere private.',
    theme: THEMES['touch-grass'],
  },
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    tagline: 'Most commits land between midnight and 4am.',
    meaning: 'The world is quiet then. So is your inbox.',
    theme: THEMES.vampire,
  },
  'weekend-warrior': {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    tagline: 'Weekends out-commit weekdays.',
    meaning: 'The day job pays for the work that actually interests you.',
    theme: THEMES['weekend-warrior'],
  },
};

function midday(s: HourStats) {
  const total = s.total || 1;
  return ((s.hourly[12] ?? 0) / total) * 100;
}

/** Classify a user given their hour stats. Returns the dominant archetype. */
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
