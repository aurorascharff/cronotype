import type { Archetype, ArchetypeId, HourStats } from '@/types/cronotype';

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  drifter: {
    colorVar: 'text-drifter',
    glowVar: 'from-drifter/0 via-drifter to-drifter-glow',
    id: 'drifter',
    name: 'Drifter',
    tagline: 'Your commit graph is a snowstorm. There is no pattern. There is no plan.',
  },
  'insomniac-maintainer': {
    colorVar: 'text-insomniac',
    glowVar: 'from-insomniac/0 via-insomniac to-insomniac-glow',
    id: 'insomniac-maintainer',
    name: 'Insomniac Maintainer',
    tagline: 'You work the day shift. Then you fix prod at 2am. Sleep is for v2.',
  },
  'lunch-bandit': {
    colorVar: 'text-bandit',
    glowVar: 'from-bandit/0 via-bandit to-bandit-glow',
    id: 'lunch-bandit',
    name: 'Lunch Bandit',
    tagline: 'You commit during lunch like nobody can see you. We can see you.',
  },
  'nine-to-fiver': {
    colorVar: 'text-nineto5',
    glowVar: 'from-nineto5/0 via-nineto5 to-nineto5-glow',
    id: 'nine-to-fiver',
    name: 'Nine-to-Fiver',
    tagline: 'Tight 9-to-6 distribution. Low variance. You log off. We respect it.',
  },
  'sunrise-sniper': {
    colorVar: 'text-sunrise',
    glowVar: 'from-sunrise/0 via-sunrise to-sunrise-glow',
    id: 'sunrise-sniper',
    name: 'Sunrise Sniper',
    tagline: 'Dawn commits. Empty inbox. You scare your team.',
  },
  'touch-grass': {
    colorVar: 'text-touchgrass',
    glowVar: 'from-touchgrass/0 via-touchgrass to-touchgrass-glow',
    id: 'touch-grass',
    name: 'Touch Grass',
    tagline: "You don't commit much. Your relationships are probably fine.",
  },
  vampire: {
    colorVar: 'text-vampire',
    glowVar: 'from-vampire/0 via-vampire to-vampire-glow',
    id: 'vampire',
    name: 'Vampire',
    tagline: 'You commit when normal people are dreaming. The sun is a rumor.',
  },
  'weekend-warrior': {
    colorVar: 'text-warrior',
    glowVar: 'from-warrior/0 via-warrior to-warrior-glow',
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    tagline: 'Monday: meetings. Saturday: shipping. You have priorities.',
  },
};

function pct(n: number) {
  return Math.round(n);
}

function midday(s: HourStats) {
  const total = s.total || 1;
  return ((s.hourly[12] ?? 0) / total) * 100;
}

/** Classify a user given their hour stats. Returns the dominant archetype. */
export function classify(stats: HourStats): Archetype {
  if (stats.total < 25) return ARCHETYPES['touch-grass'];

  if (stats.pctNocturnal > 30) return ARCHETYPES.vampire;
  if (stats.pctSunrise > 25) return ARCHETYPES['sunrise-sniper'];

  // Lunch bandit — disproportionate midday spike vs neighboring hours
  const lunchSpike = midday(stats);
  const neighborAvg = (((stats.hourly[11] ?? 0) + (stats.hourly[13] ?? 0)) / 2 / (stats.total || 1)) * 100;
  if (lunchSpike > 8 && lunchSpike > neighborAvg * 1.6) return ARCHETYPES['lunch-bandit'];

  if (stats.pctWeekend > 40) return ARCHETYPES['weekend-warrior'];
  if (stats.isBimodal) return ARCHETYPES.insomniac;
  if (stats.pctBusiness > 70 && stats.hourlyVariance < 5) return ARCHETYPES['nine-to-fiver'];

  return ARCHETYPES.drifter;
}

/** A rough percentile — the higher the dominant trait, the higher the rank. */
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
