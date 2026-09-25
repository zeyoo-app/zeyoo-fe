'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { LOCALES, messages, type Locale, type MessageKey } from './messages';

interface I18nContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const STORAGE_KEY = 'zeyoo.locale';

function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return LOCALES.includes(stored as Locale) ? (stored as Locale) : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // The stored preference lives in localStorage, which is unavailable during SSR,
    // so it can only be read after mount — SSR renders the default until then.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(readStoredLocale());
  }, []);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persisting the preference is best-effort; the in-memory locale still applies.
    }
    setLocaleState(next);
  }, []);

  const t = useCallback((key: MessageKey) => messages[locale][key] ?? messages.en[key], [locale]);

  const value = useMemo<I18nContextValue>(() => ({ locale, dir, setLocale, t }), [locale, dir, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider.');
  }
  return context;
}
