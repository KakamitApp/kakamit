import { useI18n } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from '@/lib/router';

export default function Dgbs() {
  const { t } = useI18n();

  return (
    <main class="flex-1">
      <div class="container mx-auto max-w-3xl py-12 px-4 md:px-6">
        <h1 class="text-4xl font-headline font-bold mb-6 text-center">
          {t('dgbs.title')}
        </h1>
        <div class="prose prose-lg mx-auto text-foreground space-y-4 mb-8">
          <p style="white-space: pre-line">{t('dgbs.p1')}</p>
        </div>
        <div class="space-y-4">
          {[1, 2, 3, 4, 5].map(level => (
            <Card key={level}>
              <CardHeader>
                <CardTitle class="text-xl">{t(`dgbs.levels.level${level}.title`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{t(`dgbs.levels.level${level}.description`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div class="text-center mt-12">
          <Link
            href="/"
            class="inline-flex items-center justify-center h-10 px-8 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
          >
            {t('about.backButton')}
          </Link>
        </div>
      </div>
    </main>
  );
}
