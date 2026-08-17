import type { ValueEntry } from './types';
import { subDays, startOfDay, isSameDay } from './dates';

/**
 * The daily evaluation prompts for *yesterday's* gas burden. It is considered
 * pending (and the card is shown) until a DGBS entry exists for yesterday.
 */
export function isDgbsPending(entries: ValueEntry[]): boolean {
  const yesterday = startOfDay(subDays(new Date(), 1));
  return !entries.some(
    e => e.type === 'DGBS' && isSameDay(new Date(e.timestamp), yesterday)
  );
}
