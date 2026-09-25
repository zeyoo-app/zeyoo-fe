'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { Role } from '../api/types';
import { useAuthStore } from './authStore';
import { homePathForRole } from './roles';

/**
 * Client-side route guard for a role's app shell. Sends unauthenticated users to
 * sign-in, unverified users to email confirmation, and users of the wrong role to
 * their own home. This is defense-in-depth over the backend PolicyGuard, never the
 * sole gate (IMPLEMENTATION_PLAN §7).
 */
export function useRequireRole(role: Role): { ready: boolean } {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session) {
      router.replace('/sign-in');
      return;
    }
    if (!session.emailVerified) {
      router.replace('/confirm-email');
      return;
    }
    if (session.role !== role) {
      router.replace(homePathForRole(session.role));
    }
  }, [status, session, role, router]);

  const ready = status === 'authenticated' && session?.role === role && session.emailVerified;
  return { ready };
}
