import { useI18n } from '@/lib/i18n';
import { useEntries } from '@/lib/entries';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router';

export default function About() {
  const { t } = useI18n();
  const { generateTestData } = useEntries();

  return (
    <main class="flex-1">
      <div class="container mx-auto max-w-3xl py-12 px-4 md:px-6">
        <div class="flex justify-center mb-8">
          <img src="/kakamit.png" alt="Kakamit Logo" width={140} height={40} />
        </div>
        <h1 class="text-4xl font-headline font-bold mb-6 text-center">
          {t('about.title')}
        </h1>
        <div class="prose prose-lg mx-auto text-foreground space-y-4">
          <p>{t('about.p1')}</p>
          <p>{t('about.p2')}</p>
          <p>{t('about.p3')}</p>
        </div>
        <div class="text-center mt-12 space-x-4">
          <Link
            href="/"
            class="inline-flex items-center justify-center h-10 px-8 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
          >
            {t('about.backButton')}
          </Link>
          <Button variant="outline" onClick={generateTestData}>
            {t('about.generateTestData')}
          </Button>
        </div>
      </div>
    </main>
  );
}
