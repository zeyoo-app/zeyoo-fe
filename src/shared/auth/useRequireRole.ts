'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { Role, Session } from '../api/types';
import { useAuthStore } from './authStore';
import { routeForSession } from './routeForSession';

/**
 * Client-side route guard for a role's app shell. Sends unauthenticated users to
 * sign-in, unverified users to email confirmation, users who have not finished
 * onboarding to their setup screen, and users of the wrong role to their own home.
 * This is defense-in-depth over the backend PolicyGuard, never the sole gate
 * (IMPLEMENTATION_PLAN §7). `skipOnboarding` is for the setup screens themselves,
 * which are exactly where a half-onboarded user belongs.
 */
export function useRequireRole(role: Role, options?: { skipOnboarding?: boolean }): { ready: boolean } {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const session = useAuthStore((state) => state.session);
  const skipOnboarding = options?.skipOnboarding ?? false;

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session) {
      router.replace('/sign-in');
      return;
    }
    if (session.role !== role) {
      router.replace(routeForSession(session));
      return;
    }
    // A verified user still on the setup screen has nothing to do in the app yet.
    if (!skipOnboarding && !hasFinishedOnboarding(session)) {
      router.replace(routeForSession(session));
    }
  }, [status, session, role, skipOnboarding, router]);

  const ready =
    status === 'authenticated' &&
    session?.role === role &&
    (skipOnboarding || hasFinishedOnboarding(session));

  return { ready };
}

/** Brand setup is complete once the organization exists; creator setup once the
 *  profile does. An older stored session without the flags counts as complete. */
function hasFinishedOnboarding(session: Session): boolean {
  return session.role === 'brand' ? session.hasOrganization !== false : session.hasCreatorProfile !== false;
}
