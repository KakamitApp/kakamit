import { createContext } from 'preact';
import { useState, useEffect, useCallback, useContext, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { ValueEntry } from './types';
import { getAllEntries, addEntry as dbAdd, deleteEntry as dbDelete, updateEntry as dbUpdate, bulkAdd } from './db';
import { subDays } from './dates';

interface EntriesContextType {
  entries: ValueEntry[];
  loading: boolean;
  addEntry: (entry: Omit<ValueEntry, 'id' | 'uid'>) => Promise<void>;
  updateEntry: (id: string, changes: Partial<Pick<ValueEntry, 'value' | 'comment'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  importEntries: (entries: ValueEntry[]) => Promise<void>;
  generateTestData: () => Promise<void>;
}

const EntriesContext = createContext<EntriesContextType>({
  entries: [],
  loading: true,
  addEntry: async () => {},
  updateEntry: async () => {},
  deleteEntry: async () => {},
  importEntries: async () => {},
  generateTestData: async () => {},
});

function generateTestDataInternal(): ValueEntry[] {
  const entries: ValueEntry[] = [];
  const now = new Date();

  for (let i = 0; i < 90; i++) {
    if (i === 1) continue;
    const day = subDays(now, i);

    const count = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < count; j++) {
      const h = Math.floor(Math.random() * 24);
      const m = Math.floor(Math.random() * 60);
      const ts = new Date(day);
      ts.setHours(h, m, 0, 0);

      entries.push({
        id: crypto.randomUUID(),
        uid: 'kakamit-pwa',
        timestamp: ts.toISOString(),
        value: Math.floor(Math.random() * 7) + 1,
        comment: Math.random() > 0.7 ? `Test ${i}-${j}` : undefined,
        type: 'stool',
      });
    }

    if (i !== 0) {
      const evalTs = new Date(day);
      evalTs.setHours(8, 0, 0, 0);
      entries.push({
        id: crypto.randomUUID(),
        uid: 'kakamit-pwa',
        timestamp: evalTs.toISOString(),
        value: Math.floor(Math.random() * 5) + 1,
        type: 'DGBS',
      });
    }
  }
  return entries;
}

export function EntriesProvider({ children }: { children: ComponentChildren }) {
  const [entries, setEntries] = useState<ValueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    getAllEntries()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addEntry = useCallback(async (entry: Omit<ValueEntry, 'id' | 'uid'>) => {
    const newEntry: ValueEntry = {
      ...entry,
      id: crypto.randomUUID(),
      uid: 'kakamit-pwa',
      timestamp: entry.timestamp || new Date().toISOString(),
    };

    setEntries(prev => {
      const updated = [newEntry, ...prev];
      updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return updated;
    });

    try {
      await dbAdd(newEntry);
    } catch (err) {
      console.error('Failed to save entry:', err);
      setEntries(prev => prev.filter(e => e.id !== newEntry.id));
    }
  }, []);

  const updateEntry = useCallback(async (id: string, changes: Partial<Pick<ValueEntry, 'value' | 'comment'>>) => {
    const previous = entriesRef.current.find(e => e.id === id);
    if (!previous) return;

    const updated: ValueEntry = {
      ...previous,
      ...changes,
      comment: 'comment' in changes ? (changes.comment || undefined) : previous.comment,
    };

    setEntries(prev => prev.map(e => (e.id === id ? updated : e)));

    try {
      await dbUpdate(updated);
    } catch (err) {
      console.error('Failed to update entry:', err);
      setEntries(prev => prev.map(e => (e.id === id ? previous : e)));
      throw err;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const deleted = entriesRef.current.find(e => e.id === id);
    setEntries(prev => prev.filter(e => e.id !== id));

    try {
      await dbDelete(id);
    } catch (err) {
      console.error('Failed to delete entry:', err);
      if (deleted) {
        setEntries(prev => {
          const restored = [...prev, deleted];
          restored.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return restored;
        });
      }
    }
  }, []);

  const importEntries = useCallback(async (imported: ValueEntry[]) => {
    if (!imported.length) return;
    // Upsert by id (strategy A): re-importing an export restores/updates the
    // same records instead of creating duplicates. bulkAdd uses put().
    await bulkAdd(imported);
    const all = await getAllEntries();
    setEntries(all);
  }, []);

  const generateTestData = useCallback(async () => {
    const data = generateTestDataInternal();
    await bulkAdd(data);
    const all = await getAllEntries();
    setEntries(all);
  }, []);

  return (
    <EntriesContext.Provider value={{ entries, loading, addEntry, updateEntry, deleteEntry, importEntries, generateTestData }}>
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries() {
  return useContext(EntriesContext);
}
