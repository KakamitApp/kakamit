import { useState, useEffect, useMemo } from 'preact/hooks';
import { useEntries } from '@/lib/entries';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ScaleSelector, type ScaleItem } from '@/components/scale-selector';
import type { ValueEntry } from '@/lib/types';

interface EditEntryDialogProps {
  entry: ValueEntry | null;
  onClose: () => void;
}

const STOOL_VALUES = [1, 2, 3, 4, 5, 6, 7];
const DGBS_VALUES = [1, 2, 3, 4, 5];

export function EditEntryDialog({ entry, onClose }: EditEntryDialogProps) {
  const { updateEntry } = useEntries();
  const { t } = useI18n();
  const { toast } = useToast();
  const [value, setValue] = useState(1);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill the form whenever a different entry is opened.
  useEffect(() => {
    if (entry) {
      setValue(entry.value);
      setComment(entry.comment ?? '');
      setSubmitting(false);
    }
  }, [entry?.id]);

  const isDGBS = entry?.type === 'DGBS';

  const items = useMemo<ScaleItem[]>(() => {
    if (isDGBS) {
      return DGBS_VALUES.map((v) => ({
        value: v,
        image: `/DGBS_${v}.png`,
        alt: t(`dgbs.levels.level${v}.title`),
      }));
    }
    return STOOL_VALUES.map((v) => ({
      value: v,
      image: `/200_kaka_${v}.png`,
      alt: t(`selection.type${v}`),
    }));
  }, [isDGBS, t]);

  const selectedTitle = isDGBS
    ? t(`dgbs.levels.level${value}.title`)
    : `${t('selection.typeLabel')} ${value}`;
  const selectedDescription = isDGBS
    ? t(`dgbs.levels.level${value}.description`)
    : t(`selection.type${value}`);

  const handleSave = async () => {
    if (!entry) return;
    setSubmitting(true);
    try {
      await updateEntry(entry.id, { value, comment });
      toast({ title: t('toast.success'), description: t('toast.entryUpdated') });
      onClose();
    } catch {
      toast({ title: t('toast.error'), description: t('toast.saveError') });
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!entry} onClose={onClose}>
      <h2 class="text-lg font-semibold">{t('list.editEntryTitle')}</h2>

      <div class="mt-4">
        <ScaleSelector items={items} value={value} onChange={setValue} />
        <div class="mt-3 flex min-h-[64px] flex-col justify-center rounded-lg bg-muted/50 p-3 text-center">
          <p class="font-semibold">{selectedTitle}</p>
          <p class="mt-0.5 text-sm text-muted-foreground">{selectedDescription}</p>
        </div>
      </div>

      <div class="mt-4 space-y-2">
        <label class="text-sm font-medium">{t('form.commentLabel')}</label>
        <textarea
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={t('form.commentPlaceholder')}
          value={comment}
          maxLength={200}
          onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          {t('list.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={submitting}>
          {submitting ? t('form.savingButton') : t('form.saveButton')}
        </Button>
      </div>
    </Dialog>
  );
}
