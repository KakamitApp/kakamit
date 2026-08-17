import { createContext } from 'preact';
import { useState, useEffect, useCallback, useContext } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import en from '@/locales/en.json';

export type Locale = 'en' | 'fi' | 'es' | 'fr' | 'zh' | 'de' | 'hi' | 'ja' | 'ko' | 'pt' | 'sv' | 'it' | 'th';

const SUPPORTED: Locale[] = ['en', 'fi', 'es', 'fr', 'zh', 'de', 'hi', 'ja', 'ko', 'pt', 'sv', 'it', 'th'];

type TranslationValue = string | TranslationTree;
interface TranslationTree { [key: string]: TranslationValue }
type TranslationData = TranslationTree;

// Explicit loader map. `en` is imported statically (it is the synchronous
// fallback and lives in the main bundle); the other 12 locales are lazy-loaded.
// Excluding `en` here avoids the "statically + dynamically imported" build warning.
const LOADERS: Record<Exclude<Locale, 'en'>, () => Promise<{ default: TranslationData }>> = {
  fi: () => import('../locales/fi.json'),
  es: () => import('../locales/es.json'),
  fr: () => import('../locales/fr.json'),
  zh: () => import('../locales/zh.json'),
  de: () => import('../locales/de.json'),
  hi: () => import('../locales/hi.json'),
  ja: () => import('../locales/ja.json'),
  ko: () => import('../locales/ko.json'),
  pt: () => import('../locales/pt.json'),
  sv: () => import('../locales/sv.json'),
  it: () => import('../locales/it.json'),
  th: () => import('../locales/th.json'),
};

async function loadTranslation(locale: Locale): Promise<TranslationData> {
  if (locale === 'en') return en;
  try {
    const mod = await LOADERS[locale]();
    return mod.default;
  } catch {
    return en;
  }
}

function getNested(obj: TranslationData, path: string): string | undefined {
  let current: TranslationValue | undefined = obj;
  for (const part of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  dateLocale: string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => k,
  dateLocale: 'en-US',
});

const LOCALE_MAP: Record<Locale, string> = {
  en: 'en-US', fi: 'fi-FI', es: 'es-ES', fr: 'fr-FR', zh: 'zh-CN',
  de: 'de-DE', hi: 'hi-IN', ja: 'ja-JP', ko: 'ko-KR', pt: 'pt-BR',
  sv: 'sv-SE', it: 'it-IT', th: 'th-TH',
};

export function I18nProvider({ children }: { children: ComponentChildren }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [translations, setTranslations] = useState<TranslationData>(en);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    const data = await loadTranslation(newLocale);
    setTranslations(data);
    localStorage.setItem('locale', newLocale);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved && SUPPORTED.includes(saved)) {
      setLocale(saved);
    } else {
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (SUPPORTED.includes(browserLang) && browserLang !== 'en') {
        setLocale(browserLang);
      }
    }
  }, [setLocale]);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let str = getNested(translations, key) || getNested(en, key) || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{{${k}}}`, v);
      }
    }
    return str;
  }, [translations]);

  const dateLocale = LOCALE_MAP[locale] || 'en-US';

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dateLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
