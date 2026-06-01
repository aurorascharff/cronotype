import type { HourStats } from '@/types/cronotype';

export type Commit = {
  authoredAt: string;
  tzOffsetMinutes: number | null;
  repo: string;
};

export function buildStats(commits: Commit[]): HourStats {
  const hourly = new Array<number>(24).fill(0);
  const weekday = new Array<number>(7).fill(0);
  let weekendCount = 0;

  const tzVotes = new Map<number, number>();

  for (const c of commits) {
    const dt = new Date(c.authoredAt);
    if (Number.isNaN(dt.getTime())) continue;

    const offsetMin = c.tzOffsetMinutes ?? 0;
    const local = new Date(dt.getTime() + offsetMin * 60_000);
    const hour = local.getUTCHours();
    const wday = local.getUTCDay();
    hourly[hour]++;
    weekday[wday]++;
    if (wday === 0 || wday === 6) weekendCount++;

    if (c.tzOffsetMinutes != null) {
      const hours = c.tzOffsetMinutes / 60;
      tzVotes.set(hours, (tzVotes.get(hours) ?? 0) + 1);
    }
  }

  const total = commits.length || 1;

  const peakHour = hourly.indexOf(Math.max(...hourly));
  const pctNocturnal = (sumRange(hourly, 0, 4) / total) * 100;
  const pctSunrise = (sumRange(hourly, 5, 8) / total) * 100;
  const pctBusiness = (sumRange(hourly, 9, 18) / total) * 100;
  const pctWeekend = (weekendCount / total) * 100;
  const hourlyVariance = variancePct(hourly, total);
  const isBimodal = detectBimodal(hourly);

  let tzOffsetHours: number | null = null;
  if (tzVotes.size) {
    let bestKey = 0;
    let bestVal = -1;
    for (const [k, v] of tzVotes) {
      if (v > bestVal) {
        bestKey = k;
        bestVal = v;
      }
    }
    tzOffsetHours = bestKey;
  }

  return {
    hourly,
    hourlyVariance,
    isBimodal,
    pctBusiness,
    pctNocturnal,
    pctSunrise,
    pctWeekend,
    peakHour,
    total: commits.length,
    tzOffsetHours,
    weekday,
  };
}

function sumRange(arr: number[], from: number, to: number): number {
  let s = 0;
  for (let i = from; i <= to; i++) s += arr[i] ?? 0;
  return s;
}

function variancePct(arr: number[], total: number): number {
  const pcts = arr.map(v => (v / total) * 100);
  const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  const variance = pcts.reduce((a, b) => a + (b - mean) ** 2, 0) / pcts.length;
  return Math.sqrt(variance);
}

function detectBimodal(hourly: number[]): boolean {
  if (hourly.length !== 24) return false;
  const total = hourly.reduce((a, b) => a + b, 0) || 1;
  const pcts = hourly.map(v => (v / total) * 100);

  const day = pcts.slice(9, 18).reduce((a, b) => a + b, 0);
  const night = pcts.slice(22).concat(pcts.slice(0, 4)).reduce((a, b) => a + b, 0);
  const valley = pcts.slice(18, 22).reduce((a, b) => a + b, 0);

  return day > 25 && night > 20 && valley < day * 0.45;
}
