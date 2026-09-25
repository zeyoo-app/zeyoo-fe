'use client';

import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { SessionShell } from '@/shared/shell';

export default function Page() {
  return (
    <SessionShell>
      <SettingsScreen />
    </SessionShell>
  );
}
