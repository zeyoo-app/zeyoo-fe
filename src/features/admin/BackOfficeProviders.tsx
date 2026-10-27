'use client';

import { useEffect, type ReactNode } from 'react';

import { ApiProvider, STAFF_SESSION_CHANNEL } from '@/shared/api';

import { useStaffSession } from './staffSession';

/**
 * Everything under /admin talks to the API as staff: its own client, query cache and
 * session, nested inside (and shadowing) the app's.
 */
export function BackOfficeProviders({ children }: { children: ReactNode }) {
  const hydrate = useStaffSession((state) => state.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <ApiProvider channel={STAFF_SESSION_CHANNEL}>{children}</ApiProvider>;
}
