import type { Archetype, ArchetypeId, ArchetypeTheme, HourStats } from '@/types/cronotype';

/** One shared theme — true blue. The diagnostic is the word, not the color. */
const BRAND: ArchetypeTheme = {
  accent: '#3b82f6',
  accent2: '#60a5fa',
  bgDark: '#0a1224',
  bgLight: '#eff6ff',
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  drifter: {
    id: 'drifter',
    name: 'Drifter',
    tagline: 'Your commit graph is a snowstorm. There is no pattern. There is no plan.',
    theme: BRAND,
  },
  'insomniac-maintainer': {
    id: 'insomniac-maintainer',
    name: 'Insomniac Maintainer',
    tagline: 'You work the day shift. Then you fix prod at 2am. Sleep is for v2.',
    theme: BRAND,
  },
  'lunch-bandit': {
    id: 'lunch-bandit',
    name: 'Lunch Bandit',
    tagline: 'You commit during lunch like nobody can see you. We can see you.',
    theme: BRAND,
  },
  'nine-to-fiver': {
    id: 'nine-to-fiver',
    name: 'Nine-to-Fiver',
    tagline: 'Tight 9-to-6 distribution. Low variance. You log off. We respect it.',
    theme: BRAND,
  },
  'sunrise-sniper': {
    id: 'sunrise-sniper',
    name: 'Sunrise Sniper',
    tagline: 'Dawn commits. Empty inbox. You scare your team.',
    theme: BRAND,
  },
  'touch-grass': {
    id: 'touch-grass',
    name: 'Touch Grass',
    tagline: "You don't commit much. Your relationships are probably fine.",
    theme: BRAND,
  },
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    tagline: 'You commit when normal people are dreaming. The sun is a rumor.',
    theme: BRAND,
  },
  'weekend-warrior': {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    tagline: 'Monday: meetings. Saturday: shipping. You have priorities.',
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
