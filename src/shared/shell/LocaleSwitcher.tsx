'use client';

import { Languages } from 'lucide-react';

import { LOCALES, useI18n } from '@/shared/i18n';

/** Cycles the app locale (EN ⇄ AR) and flips layout direction with it. */
export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      aria-label="Switch language"
      className="flex items-center gap-1 rounded-lg p-2 text-text-muted hover:bg-surface-hover"
    >
      <Languages className="size-5" />
      <span className="text-xs font-medium uppercase">{locale}</span>
    </button>
  );
}
