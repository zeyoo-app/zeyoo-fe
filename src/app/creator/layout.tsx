'use client';

import { AppShell, navForRole } from '@/shared/shell';

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="creator" nav={navForRole('creator')}>
      {children}
    </AppShell>
  );
}
