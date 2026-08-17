import { useEffect } from 'preact/hooks';
import { DailyEvaluation } from '@/components/daily-evaluation';
import { StreakBadge } from '@/components/streak-badge';
import { ValueForm } from '@/components/value-form';
import { ValueChart } from '@/components/value-chart';
import { ValueList } from '@/components/value-list';
import { InsightsCard } from '@/components/insights-card';
import { useI18n } from '@/lib/i18n';
import { useEntries } from '@/lib/entries';
import { isDgbsPending } from '@/lib/dgbs';
import { Link } from '@/lib/router';

// Module-level so the auto-focus only runs once per app session, not on every
// navigation back to the home page.
let didInitialFocus = false;

export default function Home() {
  const { t, locale } = useI18n();
  const { loading, entries } = useEntries();
  const fodmapLang = locale === 'fi' ? 'fi' : 'en';

  useEffect(() => {
    if (loading || didInitialFocus) return;
    didInitialFocus = true;
    // Wait a frame so the cards have laid out before we scroll.
    requestAnimationFrame(() => {
      if (isDgbsPending(entries)) {
        // DGBS is the priority and sits at the top, under the sticky header.
        window.scrollTo({ top: 0 });
      } else {
        // DGBS already logged: bring the Bristol stool form into view.
        document.getElementById('focus-bristol')?.scrollIntoView({ block: 'start' });
      }
    });
  }, [loading, entries]);

  return (
    <>
      <main class="flex flex-1 flex-col items-center gap-8 p-4 md:p-8">
        <div class="w-full max-w-2xl space-y-8">
          <DailyEvaluation />
          <StreakBadge />
          <div id="focus-bristol" class="scroll-mt-20">
            <ValueForm />
          </div>
          <InsightsCard />
          <ValueChart />
          <ValueList />
        </div>
      </main>
      <footer class="py-6 px-4 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} KAKAMIT. {t('footer.rights')}{' '}
          <Link href="/features" class="underline hover:text-primary">{t('footer.featuresLink')}</Link>
          {' \u00b7 '}
          <Link href="/about" class="underline hover:text-primary">{t('footer.aboutLink')}</Link>
          {' \u00b7 '}
          <Link href="/privacy" class="underline hover:text-primary">{t('footer.privacyLink')}</Link>
          {' \u00b7 '}
          <a href={`/fodmap/${fodmapLang}/`} class="underline hover:text-primary">{t('footer.fodmapLink')}</a>
          {' \u00b7 '}
          <a href={`/faq/${fodmapLang}/`} class="underline hover:text-primary">FAQ</a>
        </p>
      </footer>
    </>
  );
}
