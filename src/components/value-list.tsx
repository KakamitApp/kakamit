import { useState, useMemo, useRef } from 'preact/hooks';
import { useEntries } from '@/lib/entries';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatTime, formatDayKey, startOfDay } from '@/lib/dates';
import { parseImport, parseCsvImport } from '@/lib/import';
import type { ImportResult } from '@/lib/import';
import { entriesToCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EditEntryDialog } from '@/components/edit-entry-dialog';
import { Link } from '@/lib/router';
import type { ValueEntry } from '@/lib/types';

export function ValueList() {
  const { entries, deleteEntry, importEntries, loading } = useEntries();
  const { t, dateLocale } = useI18n();
  const { toast } = useToast();
  const [toDelete, setToDelete] = useState<ValueEntry | null>(null);
  const [toEdit, setToEdit] = useState<ValueEntry | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const grouped = useMemo(() => {
    if (!entries.length) return [];

    const groups: Record<string, ValueEntry[]> = {};
    for (const entry of entries) {
      const key = formatDayKey(startOfDay(new Date(entry.timestamp)));
      (groups[key] ||= []).push(entry);
    }

    return Object.entries(groups).map(([date, items]) => {
      items.sort((a, b) => {
        if (a.type === 'DGBS' && b.type !== 'DGBS') return -1;
        if (a.type !== 'DGBS' && b.type === 'DGBS') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      return { date, entries: items };
    });
  }, [entries]);

  const downloadFile = (data: string, filename: string, mime: string) => {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (!entries.length) return;
    downloadFile(
      JSON.stringify(entries, null, 2),
      `kakamit-data-${formatDayKey(new Date())}.json`,
      'application/json',
    );
  };

  const handleExportCsv = () => {
    if (!entries.length) return;
    downloadFile(
      entriesToCsv(entries),
      `kakamit-data-${formatDayKey(new Date())}.csv`,
      'text/csv;charset=utf-8',
    );
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // reset so the same file can be selected again
    if (!file) return;
    try {
      const text = await file.text();
      let result: ImportResult;
      if (file.name.toLowerCase().endsWith('.csv')) {
        result = parseCsvImport(text);
      } else {
        // Default to JSON; fall back to CSV if the file isn't valid JSON.
        try {
          result = parseImport(JSON.parse(text));
        } catch {
          result = parseCsvImport(text);
        }
      }
      if (!result.valid.length) {
        toast({ title: t('list.importEmpty'), variant: 'destructive' });
        return;
      }
      setPendingImport(result);
    } catch {
      toast({ title: t('list.importError'), variant: 'destructive' });
    }
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    const { valid, skipped } = pendingImport;
    setPendingImport(null);
    try {
      await importEntries(valid);
      toast({
        title: t('list.importSuccess', { count: String(valid.length) }),
        description: skipped > 0 ? t('list.importSkipped', { count: String(skipped) }) : undefined,
      });
    } catch {
      toast({ title: t('list.importError'), variant: 'destructive' });
    }
  };

  const confirmDelete = () => {
    if (toDelete) {
      deleteEntry(toDelete.id);
      setToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('list.title')}</CardTitle>
        <CardDescription>
          <p>{t('list.description')}</p>
          <p class="mt-2">
            <strong class="font-semibold">{t('list.storageInfo.label')}</strong>{' '}
            {t('list.storageInfo.text')}
          </p>
        </CardDescription>
        <div class="mt-4 flex flex-wrap gap-3">
          <Button class="w-fit" onClick={handleExport} disabled={!entries.length}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            {t('list.exportDataButton')}
          </Button>
          <Button variant="outline" class="w-fit" onClick={handleExportCsv} disabled={!entries.length}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>
            </svg>
            {t('list.exportCsvButton')}
          </Button>
          <Button variant="outline" class="w-fit" onClick={handleImportClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
            {t('list.importDataButton')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json,text/csv,.csv"
            class="hidden"
            onChange={handleFileSelected}
          />
          <Link href="/report" class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h5"/>
            </svg>
            {t('list.reportButton')}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div class="space-y-4">
            {[1, 2, 3].map(i => <div key={i} class="animate-pulse rounded-md bg-muted h-24 w-full" />)}
          </div>
        ) : !entries.length ? (
          <p class="text-center text-muted-foreground py-8">{t('list.noEntries')}</p>
        ) : (
          <div class="space-y-8">
            {grouped.map(({ date, entries: items }) => (
              <div key={date}>
                <h3 class="text-lg font-semibold mb-4 sticky top-[56px] bg-background py-2 z-10">
                  {formatDate(new Date(date), dateLocale)}
                </h3>
                <ul class="space-y-4">
                  {items.map(entry => (
                    <li key={entry.id} class="flex items-center justify-between p-4 rounded-lg border">
                      <div class="flex-1">
                        {entry.type === 'DGBS' ? (
                          <div>
                            <p class="text-sm font-semibold text-muted-foreground">{t('list.evaluationEntriesTitle')}</p>
                            <p class="font-semibold">{t(`dgbs.levels.level${entry.value}.title`)}</p>
                            <p class="text-sm text-muted-foreground">{t(`dgbs.levels.level${entry.value}.description`)}</p>
                            {entry.comment && <p class="text-sm italic mt-1">"{entry.comment}"</p>}
                          </div>
                        ) : (
                          <div>
                            <p class="text-sm font-semibold text-muted-foreground">
                              {formatTime(new Date(entry.timestamp), dateLocale)}
                            </p>
                            <p class="font-semibold">{t('selection.typeLabel')} {entry.value}</p>
                            <p class="text-sm text-muted-foreground">{t(`selection.type${entry.value}`)}</p>
                            {entry.comment && <p class="text-sm italic mt-1">"{entry.comment}"</p>}
                          </div>
                        )}
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          class="p-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setToEdit(entry)}
                          aria-label={t('list.edit')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>
                          </svg>
                        </button>
                        <button
                          class="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => setToDelete(entry)}
                          aria-label={t('list.delete')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <EditEntryDialog entry={toEdit} onClose={() => setToEdit(null)} />

      <ConfirmDialog
        open={!!toDelete}
        title={t('list.confirmDeleteTitle')}
        description={t('list.confirmDeleteDesc')}
        confirmLabel={t('list.delete')}
        cancelLabel={t('list.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={!!pendingImport}
        title={t('list.importConfirmTitle')}
        description={t('list.importConfirmDesc', { count: String(pendingImport?.valid.length ?? 0) })}
        confirmLabel={t('list.importDataButton')}
        cancelLabel={t('list.cancel')}
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </Card>
  );
}
