'use client';

import { NotificationsScreen } from '@/features/notifications/NotificationsScreen';
import { SessionShell } from '@/shared/shell';

export default function Page() {
  return (
    <SessionShell>
      <NotificationsScreen />
    </SessionShell>
  );
}
