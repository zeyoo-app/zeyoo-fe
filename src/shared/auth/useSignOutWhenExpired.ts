'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from './authStore';
import { SESSION_EXPIRED_EVENT } from './sessionEvents';

/** Sends the person to sign-in as soon as the API says their session is gone for good. */
export function useSignOutWhenExpired(): void {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    const onExpired = (): void => {
      signOut();
      router.replace('/sign-in');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [router, signOut]);
}
