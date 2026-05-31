import type { Archetype, ArchetypeId, ArchetypeTheme, HourStats } from '@/types/cronotype';

/** One shared theme — cyan. Used only on the verdict word, halo, and percentile. */
const BRAND: ArchetypeTheme = {
  accent: '#06b6d4',
  accent2: '#22d3ee',
  bgDark: '#08090b',
  bgLight: '#fafafa',
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  drifter: {
    id: 'drifter',
    name: 'Drifter',
    tagline: 'No clear pattern. Commits scattered across the day.',
    theme: BRAND,
  },
  'insomniac-maintainer': {
    id: 'insomniac-maintainer',
    name: 'Insomniac Maintainer',
    tagline: 'Two distinct peaks: business hours and late night.',
    theme: BRAND,
  },
  'lunch-bandit': {
    id: 'lunch-bandit',
    name: 'Lunch Bandit',
    tagline: 'Disproportionate spike between noon and 1pm.',
    theme: BRAND,
  },
  'nine-to-fiver': {
    id: 'nine-to-fiver',
    name: 'Nine-to-Fiver',
    tagline: 'Tight distribution between 9am and 6pm. Low variance.',
    theme: BRAND,
  },
  'sunrise-sniper': {
    id: 'sunrise-sniper',
    name: 'Sunrise Sniper',
    tagline: 'Most commits land between 5am and 8am.',
    theme: BRAND,
  },
  'touch-grass': {
    id: 'touch-grass',
    name: 'Grass Toucher',
    tagline: 'Low commit volume in the last 90 days.',
    theme: BRAND,
  },
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    tagline: 'Most commits land between midnight and 4am.',
    theme: BRAND,
  },
  'weekend-warrior': {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    tagline: 'Weekends out-commit weekdays.',
    theme: BRAND,
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
