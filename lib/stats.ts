import type { HourStats } from '@/types/cronotype';

export type Commit = {
  authoredAt: string;
  message: string;
  parentCount: number;
  tzOffsetMinutes: number | null;
  repo: string;
};

export function signalCommits(commits: Commit[]): Commit[] {
  return commits.filter(isSignalCommit);
}

export function isSignalCommit(commit: Commit): boolean {
  if (commit.parentCount > 1) return false;

  const message = commit.message.trim().toLowerCase();
  if (!message) return true;

  const firstLine = message.split('\n', 1)[0];
  if (/^merge\b/.test(firstLine)) return false;
  if (/^(chore|build)\(deps(?:-dev)?\)!?:/.test(firstLine)) return false;
  if (/^bump .+ from .+ to .+/.test(firstLine)) return false;
  if (firstLine.includes('dependabot') || firstLine.includes('renovate')) return false;

  return true;
}

export function buildStats(commits: Commit[]): HourStats {
  const hourly = new Array<number>(24).fill(0);
  const weekday = new Array<number>(7).fill(0);
  let weekendCount = 0;

  const tzVotes = new Map<number, number>();

  for (const c of commits) {
    const parsed = parseIsoMinute(c.authoredAt);
    if (!parsed) continue;
    const local =
      c.tzOffsetMinutes == null
        ? offsetDateTime(parsed, 0)
        : { hour: parsed.hour, weekday: weekdayFromDayNumber(parsed.dayNumber) };
    const hour = local.hour;
    const wday = local.weekday;
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

type IsoMinute = {
  dayNumber: number;
  hour: number;
  minute: number;
};

function parseIsoMinute(value: string): IsoMinute | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { dayNumber: daysFromCivil(year, month, day), hour, minute };
}

function offsetDateTime(value: IsoMinute, offsetMinutes: number) {
  const total = value.hour * 60 + value.minute + offsetMinutes;
  const dayOffset = Math.floor(total / 1440);
  const minuteOfDay = ((total % 1440) + 1440) % 1440;
  const dayNumber = value.dayNumber + dayOffset;
  return {
    hour: Math.floor(minuteOfDay / 60),
    weekday: weekdayFromDayNumber(dayNumber),
  };
}

function daysFromCivil(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  m += m > 2 ? -3 : 9;
  const doy = Math.floor((153 * m + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function weekdayFromDayNumber(dayNumber: number): number {
  return (((dayNumber + 4) % 7) + 7) % 7;
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
  const night = pcts
    .slice(22)
    .concat(pcts.slice(0, 4))
    .reduce((a, b) => a + b, 0);
  const valley = pcts.slice(18, 22).reduce((a, b) => a + b, 0);

  return day > 25 && night > 20 && valley < day * 0.45;
}
