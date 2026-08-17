export type EntryType = 'stool' | 'DGBS';

export interface ValueEntry {
  id: string;
  uid: string;
  timestamp: string;
  value: number;
  comment?: string;
  type: EntryType;
}
