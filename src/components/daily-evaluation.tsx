import { useState, useEffect } from 'preact/hooks';
import { useEntries } from '@/lib/entries';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { subDays } from '@/lib/dates';
import { isDgbsPending } from '@/lib/dgbs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from '@/lib/router';

const DGBS_IMAGES = ['/DGBS_1.png', '/DGBS_2.png', '/DGBS_3.png', '/DGBS_4.png', '/DGBS_5.png'];

export function DailyEvaluation({ onEvaluation }: { onEvaluation?: () => void }) {
  const { t } = useI18n();
  const { entries, addEntry } = useEntries();
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setShow(isDgbsPending(entries));
  }, [entries]);

  if (!show) return null;

  const handleSubmit = async () => {
    if (selected === null) return;
    setSubmitting(true);
    const yesterday = subDays(new Date(), 1);
    await addEntry({
      value: selected,
      comment: comment || undefined,
      type: 'DGBS',
      timestamp: yesterday.toISOString(),
    });
    toast({ title: t('toast.success'), description: t('toast.entrySaved') });
    setSubmitting(false);
    onEvaluation?.();
  };

  const valueToShow = hovered ?? selected;

  return (
    <Card>
      <CardHeader>
        <CardTitle class="text-xl">{t('dailyEvaluation.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex justify-around gap-2" onMouseLeave={() => setHovered(null)}>
          {[1, 2, 3, 4, 5].map(v => (
            <Button
              key={v}
              variant={selected === v ? 'default' : 'outline'}
              class="h-auto p-2 flex-1"
              onClick={() => setSelected(selected === v ? null : v)}
              onMouseEnter={() => setHovered(v)}
              disabled={submitting}
            >
              <img src={DGBS_IMAGES[v - 1]} alt={t(`dgbs.levels.level${v}.title`)} width={40} height={40} />
            </Button>
          ))}
        </div>
        <div class="mt-4 p-3 bg-muted/50 rounded-lg min-h-[90px] flex items-center justify-center">
          {valueToShow ? (
            <div class="text-center">
              <p class="font-semibold text-foreground">{t(`dgbs.levels.level${valueToShow}.title`)}</p>
              <p class="text-sm text-muted-foreground mt-1">{t(`dgbs.levels.level${valueToShow}.description`)}</p>
            </div>
          ) : (
            <p class="text-sm text-center text-foreground">
              {t('dailyEvaluation.description')}{' '}
              <Link href="/dgbs" class="underline hover:text-primary">{t('dailyEvaluation.linkText')}</Link>
            </p>
          )}
        </div>
        {selected !== null && (
          <div class="mt-4 space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">{t('form.commentLabel')}</label>
              <textarea
                class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t('form.commentPlaceholder')}
                value={comment}
                maxLength={200}
                onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)}
              />
            </div>
            <Button class="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('form.savingButton') : t('form.saveButton')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
