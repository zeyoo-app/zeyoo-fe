'use client';

import type { ReactNode } from 'react';

import { useAuthStore } from '@/shared/auth';

import { AppShell } from './AppShell';
import { navForRole } from './nav';

/**
 * Shell for pages shared by both roles (notifications, settings). It frames the
 * page with the current user's own role navigation; AppShell performs the guard.
 */
export function SessionShell({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session);

  if (!session) {
    return <div className="min-h-dvh bg-bg" aria-busy />;
  }

  return (
    <AppShell role={session.role} nav={navForRole(session.role)}>
      {children}
    </AppShell>
  );
}
