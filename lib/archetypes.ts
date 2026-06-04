import type { Archetype, ArchetypeId, ArchetypeTheme, HourStats } from '@/types/cronotype';

const THEMES: Record<ArchetypeId, ArchetypeTheme> = {
  drifter: { accent: '#60a5fa', accent2: '#93c5fd', bgDark: '#08090b', bgLight: '#fafafa' },
  'insomniac-maintainer': { accent: '#ec4899', accent2: '#f472b6', bgDark: '#08090b', bgLight: '#fafafa' },
  'last-call-shipper': { accent: '#14b8a6', accent2: '#5eead4', bgDark: '#08090b', bgLight: '#fafafa' },
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
  'last-call-shipper': {
    id: 'last-call-shipper',
    name: 'Last Call Shipper',
    tagline: 'You said one more commit. The graph did not believe you.',
    meaning:
      'You come alive as the respectable workday is packing up, which is either elite focus or procrastination with excellent branding.',
    theme: THEMES['last-call-shipper'],
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

function pctRange(s: HourStats, from: number, to: number) {
  const total = s.total || 1;
  let sum = 0;
  for (let hour = from; hour <= to; hour++) sum += s.hourly[hour] ?? 0;
  return (sum / total) * 100;
}

function hasLunchSpike(s: HourStats) {
  const margin = stabilityMargin(s);
  const lunchSpike = midday(s);
  const neighborAvg = (((s.hourly[11] ?? 0) + (s.hourly[13] ?? 0)) / 2 / (s.total || 1)) * 100;
  return lunchSpike > 8 + margin / 2 && lunchSpike > neighborAvg * (1.6 + margin / 20);
}

function isVampireRhythm(s: HourStats) {
  const margin = stabilityMargin(s);
  const nightPeak = s.peakHour >= 0 && s.peakHour <= 4;
  return s.pctNocturnal > 35 + margin && (nightPeak || s.pctNocturnal > 42 + margin);
}

function isSunriseRhythm(s: HourStats) {
  const margin = stabilityMargin(s);
  const morning = pctRange(s, 5, 10);
  const morningPeak = s.peakHour >= 5 && s.peakHour <= 10;
  return morning > 28 + margin && (morningPeak || s.pctSunrise > 22 + margin) && s.pctNocturnal < 30;
}

function isWorkdayRhythm(s: HourStats) {
  const margin = stabilityMargin(s);
  const morning = pctRange(s, 5, 10);
  const workdayStart = pctRange(s, 8, 12);
  const late = pctRange(s, 18, 23);
  return (
    s.pctBusiness > 65 + margin &&
    workdayStart > 18 + margin / 2 &&
    morning > 8 + margin / 2 &&
    morning < 36 + margin &&
    late < 18 + margin &&
    s.pctNocturnal < 18 &&
    s.pctWeekend < 35
  );
}

function isLateDayRhythm(s: HourStats) {
  const margin = stabilityMargin(s);
  const morning = pctRange(s, 5, 11);
  const afternoon = pctRange(s, 13, 18);
  const evening = pctRange(s, 18, 23);
  const afternoonPeak = s.peakHour >= 13 && s.peakHour <= 18;
  const eveningPeak = s.peakHour >= 18 && s.peakHour <= 23;
  const afternoonSkew = afternoon > 42 + margin && afternoonPeak && morning < 18 + margin;
  const eveningSkew = evening > 25 + margin && (eveningPeak || evening > 34 + margin);
  return (afternoonSkew || eveningSkew) && s.pctNocturnal < 35 + margin;
}

function stabilityMargin(s: HourStats) {
  if (s.total < 50) return 5;
  if (s.total < 100) return 3;
  return 1;
}

export function classify(stats: HourStats): Archetype {
  if (stats.total < 25) return ARCHETYPES['touch-grass'];

  if (stats.total >= 35 && stats.isBimodal) return ARCHETYPES['insomniac-maintainer'];
  if (isVampireRhythm(stats)) return ARCHETYPES.vampire;
  if (isSunriseRhythm(stats)) return ARCHETYPES['sunrise-sniper'];
  if (hasLunchSpike(stats)) return ARCHETYPES['lunch-bandit'];
  if (stats.pctWeekend > 40 + stabilityMargin(stats)) return ARCHETYPES['weekend-warrior'];
  if (isLateDayRhythm(stats)) return ARCHETYPES['last-call-shipper'];
  if (isWorkdayRhythm(stats)) return ARCHETYPES['nine-to-fiver'];

  return ARCHETYPES.drifter;
}

export function percentileFor(archetype: Archetype, stats: HourStats): number {
  switch (archetype.id) {
    case 'vampire':
      return clampPct(stats.pctNocturnal * 2);
    case 'last-call-shipper':
      return clampPct(Math.max(pctRange(stats, 13, 18) * 1.7, pctRange(stats, 18, 23) * 2.3));
    case 'sunrise-sniper':
      return clampPct(pctRange(stats, 5, 10) * 2.1);
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
