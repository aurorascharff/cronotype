import { ARCHETYPES } from '@/lib/archetypes';
import type { ArchetypeId } from '@/types/cronotype';
import type { MonthBucket, YearArchetypeBucket } from '@/features/profile/profile-queries';

export type Mark = {
  archetypeId: ArchetypeId | null;
  color: string | null;
  idx: number;
  label: string | null;
  year: number;
};

export type Era = {
  color: string;
  label: string | null;
  yearLabel: string;
  startPct: number;
  endPct: number;
  unknown: boolean;
};

export function smooth(values: number[], radius: number): number[] {
  if (radius <= 0) return values;
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(values.length - 1, i + radius); j++) {
      sum += values[j];
      n++;
    }
    out.push(sum / n);
  }
  return out;
}

export function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function computeYearMarkers(months: MonthBucket[], width: number): Array<{ label: string; x: number }> {
  const seen = new Map<number, number>();
  months.forEach((m, i) => {
    const y = Number(m.month.slice(0, 4));
    if (!seen.has(y)) seen.set(y, i);
  });

  const entries = Array.from(seen.entries());
  const step = Math.max(1, Math.ceil(entries.length / 6));
  const picked = entries.filter((_, i) => i % step === 0 || i === entries.length - 1);

  return picked.map(([year, idx]) => ({
    label: String(year),
    x: (idx / (months.length - 1)) * width,
  }));
}

export function buildYearMarks(months: MonthBucket[], yearly: YearArchetypeBucket[], currentId: ArchetypeId): Mark[] {
  const archetypeByYear = new Map<number, ArchetypeId>();
  for (const y of yearly) {
    if (y.commits > 0) archetypeByYear.set(y.year, y.archetypeId);
  }

  const lastYear = months.length > 0 ? Number(months[months.length - 1].month.slice(0, 4)) : 2026;
  archetypeByYear.set(lastYear, currentId);

  const commitsByYear = new Map<number, number>();
  const firstIdxByYear = new Map<number, number>();
  months.forEach((m, i) => {
    const y = Number(m.month.slice(0, 4));
    commitsByYear.set(y, (commitsByYear.get(y) ?? 0) + m.count);
    if (!firstIdxByYear.has(y)) firstIdxByYear.set(y, i);
  });

  return Array.from(firstIdxByYear.entries())
    .filter(([year]) => (commitsByYear.get(year) ?? 0) > 0)
    .sort((a, b) => a[0] - b[0])
    .map(([year, idx]) => {
      const archetypeId = archetypeByYear.get(year) ?? null;
      const archetype = archetypeId ? ARCHETYPES[archetypeId] : null;
      return {
        archetypeId,
        color: archetype?.theme.accent ?? null,
        idx,
        label: archetype?.name ?? null,
        year,
      };
    });
}

export function buildEras(marks: Mark[], pointCount: number, fallback: string): Era[] {
  if (marks.length === 0 || pointCount < 2) {
    return [{ color: fallback, endPct: 100, label: null, startPct: 0, unknown: true, yearLabel: '' }];
  }

  const pct = (idx: number) => (idx / (pointCount - 1)) * 100;

  const eras: Era[] = [];
  let lastColor = marks[0].color ?? fallback;

  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    const unknown = !m.archetypeId;
    const color = unknown ? '#94a3b8' : (m.color ?? lastColor);
    const startPct = i === 0 ? 0 : pct(m.idx);
    const endPct = i === marks.length - 1 ? 100 : pct(marks[i + 1].idx);
    if (!unknown) lastColor = color;

    const prev = eras[eras.length - 1];
    if (prev && prev.unknown === unknown && prev.color === color && prev.label === m.label) {
      prev.endPct = endPct;
      prev.yearLabel = `${prev.yearLabel.split('-')[0]}-${m.year}`;
    } else {
      eras.push({
        color,
        endPct,
        label: m.label,
        startPct,
        unknown,
        yearLabel: String(m.year),
      });
    }
  }

  return eras;
}
