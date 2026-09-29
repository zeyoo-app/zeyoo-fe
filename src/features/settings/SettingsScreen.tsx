'use client';

import { Card, PageHeader, Switch, cn, useTheme } from '@/design-system';
import { LOCALE_LABELS, LOCALES, useI18n } from '@/shared/i18n';

export function SettingsScreen() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Appearance and language." />
      <div className="flex max-w-2xl flex-col gap-5">
        <AppearanceCard />
        <LanguageCard />
      </div>
    </>
  );
}

function AppearanceCard() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text">Dark mode</p>
        <p className="text-xs text-text-muted">Switch between light and dark themes.</p>
      </div>
      <Switch checked={theme === 'dark'} onChange={toggleTheme} label="Dark mode" />
    </Card>
  );
}

function LanguageCard() {
  const { locale, setLocale, t } = useI18n();
  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-text">{t('common.language')}</p>
      <div className="flex gap-2">
        {LOCALES.map((value) => (
          <button
            key={value}
            onClick={() => setLocale(value)}
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-medium',
              locale === value ? 'border-primary bg-primary/10 text-green-text' : 'border-border text-text-muted',
            )}
          >
            {LOCALE_LABELS[value]}
          </button>
        ))}
      </div>
    </Card>
  );
}
