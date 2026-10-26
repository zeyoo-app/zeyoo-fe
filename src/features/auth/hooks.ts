'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { API_ERROR, errorCodeOf, useApi } from '@/shared/api';
import type { OAuthProvider, Role, SignInIntent } from '@/shared/api';
import { routeForSession, useAuthStore } from '@/shared/auth';

import { acquireIdToken, startGoogleSignIn } from './socialAuth';

/** The backend's own message when it has one, so users see what actually went wrong. */
function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Drives passwordless sign-in and sign-up through an emailed or texted one-time
 * code. Sign-up creates the account once the code is verified; sign-in never does,
 * and an unknown address comes back as `accountMissing` so the screen can offer to
 * create one. Routing follows the resulting session, so a new account lands on
 * onboarding and a returning one goes straight in.
 */
export function useSignIn({ navigate = true, intent }: { navigate?: boolean; intent?: SignInIntent } = {}) {
  const api = useApi();
  const router = useRouter();
  const persistSession = useAuthStore((state) => state.signIn);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [accountMissing, setAccountMissing] = useState(false);

  async function send(request: () => Promise<{ message: string }>, fallback: string) {
    setIsPending(true);
    setError(null);
    setAccountMissing(false);
    try {
      setNotice((await request()).message);
      return true;
    } catch (cause) {
      setAccountMissing(errorCodeOf(cause) === API_ERROR.accountNotFound);
      setError(messageOf(cause, fallback));
      return false;
    } finally {
      setIsPending(false);
    }
  }

  async function verify(exchange: () => ReturnType<typeof api.verifyEmailCode>) {
    setIsPending(true);
    setError(null);
    setAccountMissing(false);
    try {
      const session = await exchange();
      persistSession(session);
      if (navigate) router.replace(routeForSession(session));
      return session;
    } catch (cause) {
      setAccountMissing(errorCodeOf(cause) === API_ERROR.accountNotFound);
      setError(messageOf(cause, 'That code is invalid or has expired. Check it and try again.'));
      return null;
    } finally {
      setIsPending(false);
    }
  }

  const requestCode = (email: string) =>
    send(() => api.requestEmailCode({ email, intent }), 'Could not send a code to that email. Please try again.');
  const requestPhoneCode = (phone: string) =>
    send(() => api.requestPhoneCode({ phone, intent }), 'Could not send a code to that number. Please try again.');
  const signInWithCode = (email: string, code: string, role?: Role) =>
    verify(() => api.verifyEmailCode({ email, code, role }));
  const signInWithPhoneCode = (phone: string, code: string, role?: Role) =>
    verify(() => api.verifyPhoneCode({ phone, code, role }));

  return {
    requestCode,
    resend: requestCode,
    signInWithCode,
    requestPhoneCode,
    resendPhoneCode: requestPhoneCode,
    signInWithPhoneCode,
    isPending,
    error,
    notice,
    accountMissing,
  };
}

export function useOAuthSignIn() {
  const api = useApi();
  const router = useRouter();
  const persistSession = useAuthStore((state) => state.signIn);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: OAuthProvider, role?: Role) {
    setPendingProvider(provider);
    setError(null);
    try {
      if (provider === 'google') {
        // Full-page redirect; the session is completed on /google-callback.
        startGoogleSignIn(role);
        return;
      }
      const idToken = await acquireIdToken(provider);
      const session = await api.oauthSignIn({ provider, idToken, role });
      persistSession(session);
      router.replace(routeForSession(session));
    } catch {
      setError(`Could not sign in with ${provider === 'apple' ? 'Apple' : 'Google'}. Please try again.`);
    } finally {
      setPendingProvider(null);
    }
  }

  return { signInWith, pendingProvider, error };
}
