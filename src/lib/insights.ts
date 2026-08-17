import type { ValueEntry } from './types';

export interface Insight {
  type: 'trend' | 'correlation' | 'weekday';
  direction?: 'up' | 'down' | 'neutral';
  value?: number;
  label?: string;
  params: Record<string, string | number>;
}

const DAY_MS = 86400000;

function dayStart(ts: string): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Trendi: vertaa viimeisen 7 pv DGBS-keskiarvoa edelliseen 7 pv:ään
 */
function computeTrend(entries: ValueEntry[], now: number): Insight | null {
  const dgbs = entries.filter(e => e.type === 'DGBS');
  if (dgbs.length < 3) return null;

  const week1Start = now - 7 * DAY_MS;
  const week2Start = now - 14 * DAY_MS;

  const thisWeek = dgbs.filter(e => {
    const t = new Date(e.timestamp).getTime();
    return t >= week1Start && t <= now;
  });
  const lastWeek = dgbs.filter(e => {
    const t = new Date(e.timestamp).getTime();
    return t >= week2Start && t < week1Start;
  });

  if (thisWeek.length < 2 || lastWeek.length < 2) return null;

  const thisAvg = avg(thisWeek.map(e => e.value));
  const lastAvg = avg(lastWeek.map(e => e.value));

  if (lastAvg === 0) return null;

  const change = Math.round(((thisAvg - lastAvg) / lastAvg) * 100);

  if (Math.abs(change) < 5) return null;

  return {
    type: 'trend',
    direction: change < 0 ? 'down' : 'up',
    value: Math.abs(change),
    params: { percent: Math.abs(change) },
  };
}

/**
 * Korrelaatio: DGBS-keskiarvo per ulostetyyppiryhmä (1-2 vs 3-4 vs 5-7)
 */
function computeCorrelation(entries: ValueEntry[]): Insight | null {
  const dgbs = entries.filter(e => e.type === 'DGBS');
  const stools = entries.filter(e => e.type === 'stool');

  if (dgbs.length < 5 || stools.length < 5) return null;

  // Ryhmitä DGBS-arviot päivän mukaan
  const dgbsByDay = new Map<number, number[]>();
  for (const e of dgbs) {
    const day = dayStart(e.timestamp);
    const arr = dgbsByDay.get(day) || [];
    arr.push(e.value);
    dgbsByDay.set(day, arr);
  }

  // Ryhmitä ulostetyypit päivän mukaan
  const stoolsByDay = new Map<number, number[]>();
  for (const e of stools) {
    const day = dayStart(e.timestamp);
    const arr = stoolsByDay.get(day) || [];
    arr.push(e.value);
    stoolsByDay.set(day, arr);
  }

  // Laske DGBS-keskiarvo päiville joissa ulostetyyppi 1-2 vs 3-5 vs 6-7
  const dgbsForHard: number[] = [];
  const dgbsForNormal: number[] = [];
  const dgbsForLoose: number[] = [];

  for (const [day, stoolValues] of stoolsByDay) {
    const dayDgbs = dgbsByDay.get(day);
    if (!dayDgbs) continue;
    const dayDgbsAvg = avg(dayDgbs);
    const stoolAvg = avg(stoolValues);

    if (stoolAvg <= 2.5) dgbsForHard.push(dayDgbsAvg);
    else if (stoolAvg <= 5) dgbsForNormal.push(dayDgbsAvg);
    else dgbsForLoose.push(dayDgbsAvg);
  }

  // Etsi merkittävin ero
  const normalAvg = avg(dgbsForNormal);
  if (dgbsForNormal.length < 2) return null;

  let bestDiff = 0;
  let bestGroup = '';

  if (dgbsForHard.length >= 2) {
    const d = avg(dgbsForHard) - normalAvg;
    if (Math.abs(d) > Math.abs(bestDiff)) {
      bestDiff = d;
      bestGroup = 'hard';
    }
  }
  if (dgbsForLoose.length >= 2) {
    const d = avg(dgbsForLoose) - normalAvg;
    if (Math.abs(d) > Math.abs(bestDiff)) {
      bestDiff = d;
      bestGroup = 'loose';
    }
  }

  if (Math.abs(bestDiff) < 0.5) return null;

  return {
    type: 'correlation',
    direction: bestDiff > 0 ? 'up' : 'down',
    value: Math.round(Math.abs(bestDiff) * 10) / 10,
    params: {
      group: bestGroup,
      diff: (Math.round(Math.abs(bestDiff) * 10) / 10).toString(),
    },
  };
}

/**
 * Viikonpäivä: etsi pahin ja paras päivä DGBS:n mukaan
 */
function computeWeekday(entries: ValueEntry[]): Insight | null {
  const dgbs = entries.filter(e => e.type === 'DGBS');
  if (dgbs.length < 14) return null; // Tarvitaan vähintään ~2 viikkoa

  const byDay: number[][] = [[], [], [], [], [], [], []];
  for (const e of dgbs) {
    const dow = new Date(e.timestamp).getDay();
    byDay[dow].push(e.value);
  }

  let worstDay = -1;
  let worstAvg = 0;
  let bestDay = -1;
  let bestAvg = 6;

  for (let i = 0; i < 7; i++) {
    if (byDay[i].length < 2) continue;
    const a = avg(byDay[i]);
    if (a > worstAvg) { worstAvg = a; worstDay = i; }
    if (a < bestAvg) { bestAvg = a; bestDay = i; }
  }

  if (worstDay === -1 || bestDay === -1) return null;
  if (worstAvg - bestAvg < 0.5) return null;

  return {
    type: 'weekday',
    params: {
      worstDay,
      worstAvg: (Math.round(worstAvg * 10) / 10).toString(),
      bestDay,
      bestAvg: (Math.round(bestAvg * 10) / 10).toString(),
    },
  };
}

/**
 * Laske kaikki oivallukset.
 * Palauttaa 0-3 insight-objektia.
 */
export function computeInsights(entries: ValueEntry[]): Insight[] {
  const now = Date.now();
  const results: Insight[] = [];

  const trend = computeTrend(entries, now);
  if (trend) results.push(trend);

  const correlation = computeCorrelation(entries);
  if (correlation) results.push(correlation);

  const weekday = computeWeekday(entries);
  if (weekday) results.push(weekday);

  return results;
}
