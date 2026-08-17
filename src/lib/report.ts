import type { ValueEntry } from './types';
import { addDays, formatDayKey, startOfDay, subDays } from './dates';

export type ReportPeriod = 7 | 30 | 90;

export interface ReportDay {
  date: Date;
  stoolValues: number[];
  dgbsValues: number[];
  comments: string[];
}

export type StoolCategory = 'hard' | 'normal' | 'loose';

export interface ReportWeek {
  label: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  daysWithData: number;
  stoolAverage: number | null;
  dgbsAverage: number | null;
  stoolEntries: number;
  dgbsEntries: number;
}

export interface ReportSummary {
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  entries: ValueEntry[];
  stoolEntries: ValueEntry[];
  dgbsEntries: ValueEntry[];
  stoolAverage: number | null;
  dgbsAverage: number | null;
  stoolDistribution: Record<number, number>;
  dgbsDistribution: Record<number, number>;
  daysWithData: number;
  missingDays: number;
  stoolCategoryCounts: Record<StoolCategory, number>;
  dominantStoolCategory: StoolCategory | null;
  highDgbsDays: number;
  looseStoolDays: number;
  maxType7Streak: number;
  maxHighDgbsStreak: number;
  weeks: ReportWeek[];
  days: ReportDay[];
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function distribution(max: number): Record<number, number> {
  const result: Record<number, number> = {};
  for (let i = 1; i <= max; i++) result[i] = 0;
  return result;
}

function stoolCategory(value: number): StoolCategory {
  if (value <= 2) return 'hard';
  if (value >= 6) return 'loose';
  return 'normal';
}

function maxConsecutive(days: ReportDay[], predicate: (day: ReportDay) => boolean): number {
  let current = 0;
  let best = 0;
  for (const day of days) {
    if (predicate(day)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function createWeeks(days: ReportDay[]): ReportWeek[] {
  const weeks: ReportWeek[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    const stoolValues = chunk.flatMap((day) => day.stoolValues);
    const dgbsValues = chunk.flatMap((day) => day.dgbsValues);
    weeks.push({
      label: `${weeks.length + 1}`,
      startDate: chunk[0].date,
      endDate: chunk[chunk.length - 1].date,
      totalDays: chunk.length,
      daysWithData: chunk.filter((day) => day.stoolValues.length || day.dgbsValues.length || day.comments.length).length,
      stoolAverage: average(stoolValues),
      dgbsAverage: average(dgbsValues),
      stoolEntries: stoolValues.length,
      dgbsEntries: dgbsValues.length,
    });
  }
  return weeks;
}

export function createReportSummary(entries: ValueEntry[], period: ReportPeriod, now = new Date()): ReportSummary {
  const endDate = startOfDay(now);
  const startDate = startOfDay(subDays(endDate, period - 1));
  const startTime = startDate.getTime();
  const endTime = addDays(endDate, 1).getTime();

  const filtered = entries
    .filter((entry) => {
      const time = new Date(entry.timestamp).getTime();
      return time >= startTime && time < endTime;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const stoolEntries = filtered.filter((entry) => entry.type === 'stool');
  const dgbsEntries = filtered.filter((entry) => entry.type === 'DGBS');
  const stoolDistribution = distribution(7);
  const dgbsDistribution = distribution(5);

  for (const entry of stoolEntries) stoolDistribution[entry.value] = (stoolDistribution[entry.value] || 0) + 1;
  for (const entry of dgbsEntries) dgbsDistribution[entry.value] = (dgbsDistribution[entry.value] || 0) + 1;

  const byDay = new Map<string, ReportDay>();
  for (let i = 0; i < period; i++) {
    const date = addDays(startDate, i);
    byDay.set(formatDayKey(date), { date, stoolValues: [], dgbsValues: [], comments: [] });
  }

  for (const entry of filtered) {
    const key = formatDayKey(startOfDay(new Date(entry.timestamp)));
    const day = byDay.get(key);
    if (!day) continue;
    if (entry.type === 'stool') day.stoolValues.push(entry.value);
    if (entry.type === 'DGBS') day.dgbsValues.push(entry.value);
    if (entry.comment?.trim()) day.comments.push(entry.comment.trim());
  }

  const days = Array.from(byDay.values());
  const daysWithData = days.filter((day) => day.stoolValues.length || day.dgbsValues.length || day.comments.length).length;
  const stoolCategoryCounts: Record<StoolCategory, number> = { hard: 0, normal: 0, loose: 0 };

  for (const entry of stoolEntries) stoolCategoryCounts[stoolCategory(entry.value)] += 1;

  const dominantStoolCategory = Object.entries(stoolCategoryCounts)
    .sort((a, b) => b[1] - a[1])[0] as [StoolCategory, number] | undefined;

  return {
    period,
    startDate,
    endDate,
    entries: filtered,
    stoolEntries,
    dgbsEntries,
    stoolAverage: average(stoolEntries.map((entry) => entry.value)),
    dgbsAverage: average(dgbsEntries.map((entry) => entry.value)),
    stoolDistribution,
    dgbsDistribution,
    daysWithData,
    missingDays: period - daysWithData,
    stoolCategoryCounts,
    dominantStoolCategory: dominantStoolCategory && dominantStoolCategory[1] > 0 ? dominantStoolCategory[0] : null,
    highDgbsDays: days.filter((day) => day.dgbsValues.some((value) => value >= 4)).length,
    looseStoolDays: days.filter((day) => day.stoolValues.some((value) => value >= 6)).length,
    maxType7Streak: maxConsecutive(days, (day) => day.stoolValues.some((value) => value === 7)),
    maxHighDgbsStreak: maxConsecutive(days, (day) => day.dgbsValues.some((value) => value >= 4)),
    weeks: createWeeks(days),
    days,
  };
}
