import type { ValueEntry } from './types';

export interface StreakResult {
  current: number;
  longest: number;
  totalEntries: number;
  isAliveToday: boolean;
}

const MILESTONES = [7, 14, 30, 60, 90, 180, 365] as const;

function dayKey(ts: string): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function prevDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Calculates the logging streak: consecutive days with at least one entry.
 * If today has no entry, the streak is still "alive" (day is not over) —
 * we count from yesterday backwards.
 */
export function computeLoggingStreak(entries: ValueEntry[]): StreakResult {
  if (entries.length === 0) {
    return { current: 0, longest: 0, totalEntries: 0, isAliveToday: false };
  }

  // Collect unique days that have at least one entry
  const daysWithEntries = new Set<string>();
  for (const e of entries) {
    daysWithEntries.add(dayKey(e.timestamp));
  }

  const today = todayKey();
  const isAliveToday = daysWithEntries.has(today);

  // Calculate current streak backwards from today (or yesterday if no entry today)
  let current = 0;
  let cursor = isAliveToday ? today : prevDay(today);

  while (daysWithEntries.has(cursor)) {
    current++;
    cursor = prevDay(cursor);
  }

  // Calculate longest streak ever — sort all days and find max consecutive run
  const sortedDays = Array.from(daysWithEntries).sort();
  let longest = 0;
  let run = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      // Check if this day is consecutive to previous
      const expected = prevDay(sortedDays[i]);
      // We need "next day" check — if sortedDays[i-1] is the day before sortedDays[i]
      if (sortedDays[i - 1] === expected) {
        run++;
      } else {
        run = 1;
      }
    }
    if (run > longest) longest = run;
  }

  return {
    current,
    longest,
    totalEntries: entries.length,
    isAliveToday,
  };
}

/**
 * Determines which milestone toast to show when streak increases.
 * Returns a milestone key or null.
 */
export function getStreakMilestone(
  current: number,
  previous: number,
  longest: number,
  totalEntries: number
): string | null {
  // First entry ever
  if (totalEntries === 1 && previous === 0) {
    return 'firstEntry';
  }

  // Streak didn't grow
  if (current <= previous) return null;

  // Check milestones (highest first)
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    const m = MILESTONES[i];
    if (current >= m && previous < m) {
      return `milestone${m}`;
    }
  }

  // New all-time record (at least 3 days to avoid noise)
  if (current > longest && current >= 3 && current !== previous + 1) {
    return 'newRecord';
  }

  // Normal growth — show simple count message
  return 'days';
}
