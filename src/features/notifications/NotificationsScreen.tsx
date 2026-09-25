'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AsyncContent, Badge, Button, Card, EmptyState, PageHeader } from '@/design-system';
import { queryKeys, useApi } from '@/shared/api';
import type { AppNotification } from '@/shared/api';

export function NotificationsScreen() {
  const api = useApi();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.notifications, queryFn: () => api.getNotifications() });
  const markRead = useMutation({
    mutationFn: () => api.markNotificationsRead(),
    onSuccess: (updated) => queryClient.setQueryData(queryKeys.notifications, updated),
  });

  const hasUnread = query.data?.some((notification) => !notification.read);

  return (
    <>
      <PageHeader
        title="Notifications"
        action={
          hasUnread ? (
            <Button size="sm" variant="secondary" fullWidth={false} loading={markRead.isPending} onClick={() => markRead.mutate()}>
              Mark all read
            </Button>
          ) : undefined
        }
      />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(notifications) =>
          notifications.length === 0 ? (
            <EmptyState title="You're all caught up" />
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </div>
          )
        }
      </AsyncContent>
    </>
  );
}

function NotificationRow({ notification }: { notification: AppNotification }) {
  return (
    <Card className="flex items-start gap-3 p-4">
      {!notification.read ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /> : <span className="mt-1.5 size-2 shrink-0" />}
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-text">{notification.title}</p>
          <span className="text-xs text-text-tertiary">{new Date(notification.date).toLocaleDateString()}</span>
        </div>
        <p className="mt-0.5 text-sm text-text-muted">{notification.body}</p>
      </div>
      {!notification.read ? <Badge tone="accent">New</Badge> : null}
    </Card>
  );
}
