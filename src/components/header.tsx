import { useState, useRef, useEffect } from 'preact/hooks';
import { useI18n } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { toggleTheme, getTheme } from '@/lib/theme';
import { Link } from '@/lib/router';

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '简体中文' },
  { code: 'es', label: 'Español' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pt', label: 'Português' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'sv', label: 'Svenska' },
  { code: 'fi', label: 'Suomi' },
  { code: 'it', label: 'Italiano' },
  { code: 'th', label: 'ไทย' },
] as const;

export function Header() {
  const { t, setLocale } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setThemeState] = useState(getTheme());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
    setThemeState(getTheme());
  };

  return (
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur print:hidden">
      <div class="container flex h-14 max-w-screen-2xl items-center">
        <div class="mr-4 flex flex-1 items-center">
          <Link href="/" class="mr-6 flex items-center">
            <img src="/kakamit.png" alt="Kakamit" width={140} height={40} />
          </Link>
          <p class="text-sm text-muted-foreground hidden md:block">
            {t('header.demoMessage')}
          </p>
        </div>
        <div class="flex items-center gap-2">
          {/* Language dropdown */}
          <div class="relative" ref={menuRef}>
            <button
              class="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent transition-colors"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              aria-label={t('header.changeLanguage')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
              </svg>
            </button>
            {menuOpen && (
              <div class="absolute right-0 top-full mt-1 w-40 rounded-md border bg-card shadow-lg z-50 max-h-80 overflow-y-auto">
                {LANGUAGES.map(({ code, label }) => (
                  <button
                    key={code}
                    class="block w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => { setLocale(code); setMenuOpen(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            class="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent transition-colors"
            onClick={handleThemeToggle}
            aria-label={t('header.toggleTheme')}
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
