export function formatHour(h: number) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

export function formatCount(n: number) {
  if (n >= 1000) {
    const thousands = n / 1000;
    return `${Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }
  return String(n);
}

export function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m followers`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k followers`;
  return `${n} followers`;
}

export function formatDateKey(value: string | undefined) {
  if (!value) return null;
  const year = value.slice(0, 4);
  const monthIndex = Number(value.slice(5, 7)) - 1;
  const day = Number(value.slice(8, 10));
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex];
  if (!month || year.length !== 4 || !Number.isFinite(day)) return null;
  return `${month} ${day}, ${year}`;
}
