'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AsyncContent, Card, Divider, Switch } from '@/design-system';
import { queryKeys, useApi } from '@/shared/api';
import type { NotificationPreferences } from '@/shared/api';
import { DetailShell } from '@/shared/shell';

type PreferenceKey = keyof NotificationPreferences;

const PREFERENCE_ROWS: { key: PreferenceKey; title: string; hint: string }[] = [
  { key: 'submissionUpdates', title: 'Submission updates', hint: 'Approvals, rejections, and views on your content.' },
  { key: 'payoutUpdates', title: 'Payout updates', hint: 'Earnings released, holds, and withdrawals.' },
  { key: 'campaignInvites', title: 'Campaign invites', hint: 'Brands inviting you to a campaign.' },
  { key: 'productNews', title: 'Product news', hint: 'Occasional news from Zeyoo.' },
];

/**
 * What Zeyoo is allowed to notify this reader about. A pushed screen rather than a
 * section of Settings, because both roles reach it from their own profile list.
 */
export function NotificationPreferencesScreen() {
  const api = useApi();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.notificationPreferences, queryFn: () => api.getNotificationPreferences() });
  const update = useMutation({
    mutationFn: (prefs: NotificationPreferences) => api.updateNotificationPreferences(prefs),
    onSuccess: (prefs) => queryClient.setQueryData(queryKeys.notificationPreferences, prefs),
  });

  return (
    <DetailShell title="Notifications" subtitle="Choose what Zeyoo sends you.">
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(prefs) => (
          <Card className="flex flex-col px-5 py-0">
            {PREFERENCE_ROWS.map((row, index) => (
              <div key={row.key}>
                <div className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[15px] text-text">{row.title}</p>
                    <p className="text-xs text-text-muted">{row.hint}</p>
                  </div>
                  <Switch
                    checked={prefs[row.key]}
                    onChange={(value) => update.mutate({ ...prefs, [row.key]: value })}
                    label={row.title}
                  />
                </div>
                {index < PREFERENCE_ROWS.length - 1 ? <Divider /> : null}
              </div>
            ))}
          </Card>
        )}
      </AsyncContent>
    </DetailShell>
  );
}
