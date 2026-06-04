import type { ArchetypeId } from '@/types/cronotype';

export function syntheticStatsFor(id: ArchetypeId, total = 200) {
  const hourly = new Array<number>(24).fill(0);
  const weekday = new Array<number>(7).fill(0);

  const seed = id.length;
  const rng = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280;
    return Math.abs(x - Math.floor(x));
  };

  const profile = HOUR_PROFILES[id];
  for (let h = 0; h < 24; h++) {
    hourly[h] = Math.max(0, Math.round((profile[h] + (rng(h) - 0.5) * 0.04) * total));
  }
  for (let d = 0; d < 7; d++) {
    weekday[d] = Math.round((d === 0 || d === 6 ? 0.07 : 0.17) * total + (rng(d + 30) - 0.5) * 4);
  }

  const sum = hourly.reduce((a, b) => a + b, 0) || 1;
  const peakHour = hourly.indexOf(Math.max(...hourly));
  const pctNocturnal = (hourly.slice(0, 5).reduce((a, b) => a + b, 0) / sum) * 100;
  const pctSunrise = (hourly.slice(5, 9).reduce((a, b) => a + b, 0) / sum) * 100;
  const pctBusiness = (hourly.slice(9, 19).reduce((a, b) => a + b, 0) / sum) * 100;
  const weekendSum = (weekday[0] ?? 0) + (weekday[6] ?? 0);
  const wsum = weekday.reduce((a, b) => a + b, 0) || 1;
  const pctWeekend = (weekendSum / wsum) * 100;

  const pcts = hourly.map(v => (v / sum) * 100);
  const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  const variance = pcts.reduce((a, b) => a + (b - mean) ** 2, 0) / pcts.length;
  const hourlyVariance = Math.sqrt(variance);

  return {
    hourly,
    hourlyVariance,
    isBimodal: id === 'insomniac-maintainer',
    pctBusiness,
    pctNocturnal,
    pctSunrise,
    pctWeekend,
    peakHour,
    total,
    tzOffsetHours: -5,
    weekday,
  };
}

const HOUR_PROFILES: Record<ArchetypeId, number[]> = {
  'last-call-shipper': [
    0.0, 0.0, 0.0, 0.0, 0.0, 0.01, 0.01, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.09, 0.11, 0.12, 0.13, 0.12, 0.1, 0.07,
    0.04, 0.02, 0.01, 0.0,
  ],
  drifter: [
    0.04, 0.03, 0.04, 0.04, 0.04, 0.05, 0.04, 0.04, 0.04, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04,
    0.04, 0.04, 0.04, 0.04, 0.04,
  ],
  'insomniac-maintainer': [
    0.05, 0.06, 0.07, 0.06, 0.03, 0.01, 0.01, 0.01, 0.02, 0.05, 0.07, 0.08, 0.08, 0.08, 0.08, 0.07, 0.05, 0.03, 0.02,
    0.02, 0.02, 0.03, 0.05, 0.05,
  ],
  'lunch-bandit': [
    0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.02, 0.05, 0.07, 0.07, 0.07, 0.13, 0.05, 0.06, 0.07, 0.08, 0.08, 0.07,
    0.04, 0.03, 0.02, 0.01, 0.01,
  ],
  'nine-to-fiver': [
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.01, 0.03, 0.09, 0.11, 0.11, 0.08, 0.1, 0.11, 0.11, 0.1, 0.08, 0.04, 0.02, 0.01,
    0.0, 0.0, 0.0,
  ],
  'sunrise-sniper': [
    0.01, 0.01, 0.01, 0.02, 0.04, 0.1, 0.13, 0.15, 0.12, 0.08, 0.06, 0.05, 0.04, 0.04, 0.04, 0.03, 0.02, 0.02, 0.01,
    0.01, 0.01, 0.01, 0.01, 0.01,
  ],
  'touch-grass': [
    0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.03, 0.04, 0.05, 0.06, 0.06, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.04,
    0.04, 0.04, 0.03, 0.03, 0.02,
  ],
  vampire: [
    0.1, 0.12, 0.13, 0.11, 0.07, 0.03, 0.02, 0.01, 0.01, 0.02, 0.03, 0.03, 0.03, 0.03, 0.03, 0.02, 0.02, 0.02, 0.02,
    0.02, 0.03, 0.04, 0.06, 0.08,
  ],
  'weekend-warrior': [
    0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.03, 0.05, 0.06, 0.06, 0.06, 0.07, 0.06, 0.06, 0.06, 0.06, 0.05, 0.05,
    0.05, 0.04, 0.04, 0.03, 0.03,
  ],
};
