import { I18nProvider } from '@/lib/i18n';
import { EntriesProvider } from '@/lib/entries';
import { ToastProvider } from '@/components/ui/toast';
import { Header } from '@/components/header';
import { Router } from '@/lib/router';

export function App() {
  return (
    <I18nProvider>
      <EntriesProvider>
        <ToastProvider>
          <div class="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <Router />
            <footer class="py-6 px-4 text-center text-sm text-muted-foreground print:hidden">
              <a href="/Daily_Gas_Burden_Scale_v1_en.pdf" class="underline mr-4" target="_blank" rel="noopener">DGBS</a>
              <a href="/release-notes/" class="underline" target="_blank" rel="noopener">Release Notes</a>
            </footer>
          </div>
        </ToastProvider>
      </EntriesProvider>
    </I18nProvider>
  );
}
