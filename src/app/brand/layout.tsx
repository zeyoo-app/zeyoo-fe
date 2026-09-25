'use client';

import { AppShell, navForRole } from '@/shared/shell';

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="brand" nav={navForRole('brand')}>
      {children}
    </AppShell>
  );
}
