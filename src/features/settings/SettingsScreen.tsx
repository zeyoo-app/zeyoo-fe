'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Card, PageHeader, Switch, cn } from '@/design-system';
import { queryKeys, useApi } from '@/shared/api';
import type { NotificationPreferences } from '@/shared/api';
import { LOCALE_LABELS, LOCALES, useI18n } from '@/shared/i18n';
import { useTheme } from '@/design-system';

type PreferenceKey = keyof NotificationPreferences;

const PREFERENCE_LABELS: Record<PreferenceKey, string> = {
  submissionUpdates: 'Submission updates',
  payoutUpdates: 'Payout updates',
  campaignInvites: 'Campaign invites',
  productNews: 'Product news',
};

export function SettingsScreen() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Appearance, notifications, and language." />
      <div className="flex max-w-2xl flex-col gap-5">
        <AppearanceCard />
        <LanguageCard />
        <NotificationPreferencesCard />
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

function NotificationPreferencesCard() {
  const api = useApi();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.notificationPreferences, queryFn: () => api.getNotificationPreferences() });
  const update = useMutation({
    mutationFn: (prefs: NotificationPreferences) => api.updateNotificationPreferences(prefs),
    onSuccess: (prefs) => queryClient.setQueryData(queryKeys.notificationPreferences, prefs),
  });

  const prefs = query.data;

  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-text">Notifications</p>
      <div className="flex flex-col gap-4">
        {(Object.keys(PREFERENCE_LABELS) as PreferenceKey[]).map((key) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-text">{PREFERENCE_LABELS[key]}</span>
            <Switch
              checked={prefs?.[key] ?? false}
              onChange={(value) => {
                if (!prefs) return;
                update.mutate({ ...prefs, [key]: value });
              }}
              label={PREFERENCE_LABELS[key]}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
