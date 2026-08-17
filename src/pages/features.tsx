import { useI18n } from '../lib/i18n';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link } from '../lib/router';

export function Features() {
  const { t } = useI18n();

  return (
    <div class="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Hero Section */}
      <section class="text-center space-y-4 pt-6">
        <h1 class="text-3xl font-bold tracking-tight text-primary">
          {t('features.hero.title')}
        </h1>
        <p class="text-lg text-muted-foreground max-w-xl mx-auto">
          {t('features.hero.subtitle')}
        </p>
        <div class="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link href="/">
            <Button class="w-full sm:w-auto">
              {t('features.hero.ctaStart')}
            </Button>
          </Link>
          <Link href="/privacy">
            <Button variant="outline" class="w-full sm:w-auto">
              {t('features.hero.ctaPrivacy')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Main Features */}
      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader class="pb-2">
            <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">💨</div>
            <CardTitle class="text-lg">{t('features.main.dgbs.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">{t('features.main.dgbs.desc')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">💩</div>
            <CardTitle class="text-lg">{t('features.main.bristol.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">{t('features.main.bristol.desc')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">🔒</div>
            <CardTitle class="text-lg">{t('features.main.log.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">{t('features.main.log.desc')}</p>
          </CardContent>
        </Card>
      </section>

      {/* Privacy First */}
      <Card class="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle class="text-xl flex items-center gap-2">
            <span>🛡️</span> {t('features.privacy.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2">
            <li class="flex items-center gap-2">
              <span class="text-primary">✓</span>
              <span>{t('features.privacy.b1')}</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-primary">✓</span>
              <span>{t('features.privacy.b2')}</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-primary">✓</span>
              <span>{t('features.privacy.b3')}</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-primary">✓</span>
              <span>{t('features.privacy.b4')}</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-primary">✓</span>
              <span>{t('features.privacy.b5')}</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Link href="/privacy" class="text-sm underline hover:text-primary">
            {t('footer.privacyLink')}
          </Link>
        </CardFooter>
      </Card>

      {/* Why Kakamit & Roadmap */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h2 class="text-xl font-bold tracking-tight">{t('features.why.title')}</h2>
          <ul class="space-y-3 text-muted-foreground">
            <li class="flex items-start gap-2">
              <span class="text-primary mt-1">•</span>
              <span>{t('features.why.f1')}</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary mt-1">•</span>
              <span>{t('features.why.f2')}</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary mt-1">•</span>
              <span>{t('features.why.f3')}</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary mt-1">•</span>
              <span>{t('features.why.f4')}</span>
            </li>
          </ul>
        </div>

        <div class="space-y-4">
          <h2 class="text-xl font-bold tracking-tight">{t('features.roadmap.title')}</h2>
          <ul class="space-y-3 text-muted-foreground">
            <li class="flex items-start gap-2">
              <span class="text-muted-foreground mt-1">○</span>
              <span>{t('features.roadmap.r1')}</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-muted-foreground mt-1">○</span>
              <span>{t('features.roadmap.r2')}</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-muted-foreground mt-1">○</span>
              <span>{t('features.roadmap.r3')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Feature Table */}
      <section class="pt-4">
        <h2 class="text-xl font-bold tracking-tight mb-4">{t('features.table.title')}</h2>
        <div class="rounded-md border overflow-hidden">
          <table class="w-full text-sm text-left">
            <thead class="bg-muted/50 border-b">
              <tr>
                <th class="px-4 py-3 font-medium">{t('features.table.hFeature')}</th>
                <th class="px-4 py-3 font-medium text-right">{t('features.table.hStatus')}</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              {[
                { name: t('features.table.f1'), active: true },
                { name: t('features.table.f2'), active: true },
                { name: t('features.table.f3'), active: true },
                { name: t('features.table.f4'), active: true },
                { name: t('features.table.f5'), active: true },
                { name: t('features.table.f6'), active: true },
                { name: t('features.table.f7'), active: true },
                { name: t('features.table.f8'), active: true },
                { name: t('features.table.f9'), active: true },
                { name: t('features.table.f10'), active: false },
              ].map((f, i) => (
                <tr key={i} class="hover:bg-muted/30 transition-colors">
                  <td class="px-4 py-3">{f.name}</td>
                  <td class="px-4 py-3 text-right">
                    {f.active ? (
                      <span class="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                        {t('features.table.active')}
                      </span>
                    ) : (
                      <span class="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        {t('features.table.planned')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trust Message */}
      <div class="text-center pt-8 pb-4">
        <p class="text-muted-foreground italic max-w-lg mx-auto">
          "{t('features.trust')}"
        </p>
      </div>

    </div>
  );
}
