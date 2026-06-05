export const RECENT_STATS_SAMPLE_SIZE = 34;

const RECENT_STATS_SAMPLE_SLICES = 3;

export type DateRange = {
  fromISO: string;
  toISO: string;
};

export async function collectRecentStatsSamples<T>(
  fromISO: string,
  toISO: string,
  fetchRange: (range: DateRange, sampleSize: number) => Promise<T[]>,
): Promise<T[]> {
  const items: T[] = [];

  for (const range of dateRangeSlices(fromISO, toISO, RECENT_STATS_SAMPLE_SLICES)) {
    items.push(...(await fetchRange(range, RECENT_STATS_SAMPLE_SIZE)));
  }

  return items;
}

export function rangeFromDayCount(toISO: string, days: number): DateRange {
  return { fromISO: dayNumberToDateKey(dateKeyToDayNumber(toISO) - days), toISO };
}

export function dateRangeSlices(fromISO: string, toISO: string, slices: number): DateRange[] {
  const from = dateKeyToDayNumber(fromISO);
  const to = dateKeyToDayNumber(toISO);
  const totalDays = Math.max(1, to - from + 1);
  const sliceDays = Math.ceil(totalDays / slices);
  const ranges: DateRange[] = [];

  for (let index = 0; index < slices; index++) {
    const sliceFrom = from + index * sliceDays;
    if (sliceFrom > to) break;
    const sliceTo = Math.min(to, sliceFrom + sliceDays - 1);
    ranges.push({
      fromISO: dayNumberToDateKey(sliceFrom),
      toISO: dayNumberToDateKey(sliceTo),
    });
  }

  return ranges;
}

export function dateKeyToDayNumber(value: string): number {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (![year, month, day].every(Number.isFinite)) throw new Error('Invalid date key.');
  return daysFromCivil(year, month, day);
}

export function dayNumberToDateKey(dayNumber: number): string {
  const { day, month, year } = civilFromDays(dayNumber);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

function civilFromDays(dayNumber: number) {
  const z = dayNumber + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  let year = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9);
  year += month <= 2 ? 1 : 0;
  return { day, month, year };
}
