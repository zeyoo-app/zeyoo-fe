'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';

export function useNotifications() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.notifications, queryFn: () => api.getNotifications() });
}

/**
 * How many notifications the reader has not opened. Derived from the list the
 * reader would fetch anyway, so a bell badge costs no extra request — and it
 * cannot disagree with the count on the notifications screen.
 */
export function useUnreadCount(): number {
  const { data } = useNotifications();
  return (data ?? []).filter((notification) => !notification.read).length;
}

export function useMarkNotificationsRead() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markNotificationsRead(),
    onSuccess: (updated) => queryClient.setQueryData(queryKeys.notifications, updated),
  });
}
