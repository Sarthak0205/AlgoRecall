// AlgoRecall spaced-repetition intervals (in days)
export const INTERVALS = [1, 3, 7, 14, 30, 60] as const;

export function nextIntervalIndex(currentIndex: number): number {
  return Math.min(currentIndex + 1, INTERVALS.length - 1);
}

// Format a Date as a local YYYY-MM-DD (avoids UTC off-by-one from toISOString).
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return formatLocalDate(d);
}

export function intervalLabel(index: number): string {
  return `Day ${INTERVALS[Math.min(index, INTERVALS.length - 1)]}`;
}
