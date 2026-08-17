import type { ValueEntry } from './types';

/** Column order for the CSV export. Matches the `ValueEntry` shape. */
export const CSV_COLUMNS = ['id', 'uid', 'timestamp', 'value', 'comment', 'type'] as const;

/** Escape a single field per RFC 4180: quote it if it contains a quote, comma, or newline. */
function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * Serialize entries to an RFC 4180 CSV string with a header row.
 * Uses CRLF line endings for maximum spreadsheet compatibility (Excel).
 */
export function entriesToCsv(entries: ValueEntry[]): string {
  const lines = [CSV_COLUMNS.join(',')];
  for (const e of entries) {
    const row = [e.id, e.uid, e.timestamp, String(e.value), e.comment ?? '', e.type];
    lines.push(row.map(escapeField).join(','));
  }
  return lines.join('\r\n');
}

/**
 * Split raw CSV text into rows of fields using a small state machine.
 * Handles quoted fields containing commas, escaped quotes (""), and newlines.
 */
function tokenize(text: string): string[][] {
  // Strip a UTF-8 BOM if present (common in files saved by Excel).
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // skip the second quote of the escaped pair
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      // Ignore; a following '\n' (CRLF) ends the row, a lone '\r' is treated as no-op.
    } else {
      field += c;
    }
  }

  // Flush the trailing field/row when the text does not end with a newline.
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Parse CSV text into an array of row objects keyed by the header row.
 * Column order is driven by the header, so re-ordered or extra columns are handled.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = tokenize(text);
  if (rows.length === 0) return [];

  const header = rows[0];
  const records: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip blank lines (a single empty field and nothing else).
    if (row.length === 1 && row[0] === '') continue;
    const record: Record<string, string> = {};
    header.forEach((name, idx) => {
      record[name] = row[idx] ?? '';
    });
    records.push(record);
  }
  return records;
}
