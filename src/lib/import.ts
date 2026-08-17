import type { ValueEntry, EntryType } from './types';
import { parseCsv } from './csv';

export interface ImportResult {
  /** Entries that passed validation and are safe to write to the DB. */
  valid: ValueEntry[];
  /** Number of rows that were skipped because they were invalid/unrecognized. */
  skipped: number;
}

const VALUE_RANGE: Record<EntryType, { min: number; max: number }> = {
  stool: { min: 1, max: 7 },
  DGBS: { min: 1, max: 5 },
};

const MAX_COMMENT_LENGTH = 200;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function normalizeType(type: unknown): EntryType | null {
  if (type === 'stool') return 'stool';
  if (type === 'DGBS') return 'DGBS';
  return null;
}

function normalizeEntry(raw: unknown): ValueEntry | null {
  if (!isRecord(raw)) return null;

  const type = normalizeType(raw.type);
  if (!type) return null;

  // value must be an integer within the type's valid range
  const value = raw.value;
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  const range = VALUE_RANGE[type];
  if (value < range.min || value > range.max) return null;

  // timestamp must be a string that parses to a real date
  const timestamp = raw.timestamp;
  if (typeof timestamp !== 'string' || Number.isNaN(new Date(timestamp).getTime())) return null;

  // id: keep if it's a non-empty string, otherwise generate a fresh one
  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : crypto.randomUUID();

  // uid: keep if present as a string, otherwise use the app's default
  const uid = typeof raw.uid === 'string' && raw.uid.length > 0 ? raw.uid : 'kakamit-pwa';

  // comment: optional, trimmed and length-capped to match the app's constraints
  let comment: string | undefined;
  if (typeof raw.comment === 'string') {
    const trimmed = raw.comment.trim();
    if (trimmed.length > 0) comment = trimmed.slice(0, MAX_COMMENT_LENGTH);
  }

  const entry: ValueEntry = { id, uid, timestamp, value, type };
  if (comment !== undefined) entry.comment = comment;
  return entry;
}

/**
 * Parse and validate the raw JSON produced by the export feature.
 * Accepts either a bare array of entries (current export format) or an object
 * with an `entries` array (future-proofing). Invalid rows are skipped and
 * counted rather than aborting the whole import.
 */
export function parseImport(raw: unknown): ImportResult {
  let list: unknown[];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (isRecord(raw) && Array.isArray(raw.entries)) {
    list = raw.entries;
  } else {
    return { valid: [], skipped: 0 };
  }

  const valid: ValueEntry[] = [];
  let skipped = 0;

  for (const item of list) {
    const entry = normalizeEntry(item);
    if (entry) valid.push(entry);
    else skipped++;
  }

  return { valid, skipped };
}

/**
 * Parse and validate CSV text produced by the export feature. Each row is run
 * through the same validator as JSON, so type/range/timestamp rules are shared.
 * The numeric `value` column is coerced from string before validation.
 */
export function parseCsvImport(text: string): ImportResult {
  const rows = parseCsv(text);
  const valid: ValueEntry[] = [];
  let skipped = 0;

  for (const row of rows) {
    const entry = normalizeEntry({ ...row, value: Number(row.value) });
    if (entry) valid.push(entry);
    else skipped++;
  }

  return { valid, skipped };
}
