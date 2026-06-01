import 'server-only';
import { computeCronotype } from '@/features/profile/profile-service';
import { getMonthlyHistory } from '@/features/profile/profile-queries';
import { buildEras, buildSmoothPath, buildYearMarks, computeYearMarkers, smooth } from '@/lib/timeline';

export type TimelineGeometry = {
  width: number;
  height: number;
  padTop: number;
  padBottom: number;
};

export async function getTimelineChart(login: string, geometry: TimelineGeometry) {
  const lower = login.toLowerCase();

  const [{ failedArchetypeYears, failedMonthlyYears, months, yearlyArchetypes, partial }, { archetype, profile }] =
    await Promise.all([getMonthlyHistory(lower), computeCronotype(lower, '90d')]);

  if (months.length < 2) {
    return {
      archetype,
      eras: [],
      failedArchetypeYears,
      failedMonthlyYears,
      hasData: false,
      months,
      partial,
      profile,
      yTicks: [],
      yearlyArchetypes,
      yearMarkers: [],
    };
  }

  const smoothed = smooth(
    months.map(m => m.count),
    2,
  );
  const max = Math.max(1, ...smoothed);
  const usableH = geometry.height - geometry.padTop - geometry.padBottom;

  const points = smoothed.map((v, i) => ({
    x: (i / (smoothed.length - 1)) * geometry.width,
    y: geometry.padTop + usableH - (v / max) * usableH,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L${geometry.width},${geometry.height - geometry.padBottom} L0,${geometry.height - geometry.padBottom} Z`;
  const yearMarkers = computeYearMarkers(months, geometry.width);
  const marks = buildYearMarks(months, yearlyArchetypes, archetype.id);
  const eras = buildEras(marks, smoothed.length, archetype.theme.accent);
  const yTicks = [max, max / 2].map(value => ({
    value: Math.round(value),
    y: geometry.padTop + usableH - (value / max) * usableH,
  }));

  return {
    archetype,
    areaPath,
    eras,
    failedArchetypeYears,
    failedMonthlyYears,
    hasData: true,
    linePath,
    months,
    partial,
    profile,
    yTicks,
    yearMarkers,
    yearlyArchetypes,
  };
}
