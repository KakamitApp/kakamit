import { useState } from 'preact/hooks';
import { useEntries } from '@/lib/entries';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { ValueSelector } from './value-selector';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export function ValueForm() {
  const [value, setValue] = useState(4);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addEntry } = useEntries();
  const { t } = useI18n();
  const { toast } = useToast();

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);
    await addEntry({
      value,
      comment: comment || undefined,
      timestamp: new Date().toISOString(),
      type: 'stool',
    });
    toast({ title: t('toast.success'), description: t('toast.entrySaved') });
    setComment('');
    setValue(4);
    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('form.title')}</CardTitle>
        <CardDescription>{t('form.description')}</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent class="space-y-8">
          <div class="flex flex-col items-center">
            <label class="font-medium text-lg mb-4">{t('form.valueLabel')}</label>
            <ValueSelector value={value} onChange={setValue} />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">{t('form.commentLabel')}</label>
            <textarea
              class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={t('form.commentPlaceholder')}
              value={comment}
              onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)}
              maxLength={200}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button class="w-full" type="submit" disabled={submitting}>
            {submitting ? t('form.savingButton') : t('form.saveButton')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
