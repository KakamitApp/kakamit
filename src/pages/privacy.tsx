import { useI18n } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from '@/lib/router';

export default function Privacy() {
  const { t } = useI18n();

  return (
    <main class="flex-1">
      <div class="container mx-auto max-w-3xl py-12 px-4 md:px-6">
        <h1 class="text-4xl font-headline font-bold mb-2 text-center">
          {t('privacy.title')}
        </h1>
        <p class="text-center text-sm text-muted-foreground mb-8">
          {t('privacy.lastUpdated')}
        </p>
        <div class="prose prose-lg mx-auto text-foreground space-y-4 mb-8">
          <p>{t('privacy.intro')}</p>
        </div>
        <div class="space-y-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <Card key={n}>
              <CardHeader>
                <CardTitle class="text-xl">{t(`privacy.section${n}.title`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p style="white-space: pre-line">{t(`privacy.section${n}.body`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div class="prose prose-lg mx-auto text-foreground space-y-2 mt-8">
          <h2 class="text-2xl font-headline font-bold">{t('privacy.contactTitle')}</h2>
          <p>{t('privacy.contactBody')}</p>
          <p>
            <a
              href="https://x.com/KakamitApp"
              target="_blank"
              rel="noopener noreferrer"
              class="underline hover:text-primary"
            >
              {t('privacy.contactHandle')}
            </a>
          </p>
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
