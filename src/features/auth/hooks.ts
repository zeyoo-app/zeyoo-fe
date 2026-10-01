'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useApi } from '@/shared/api';
import type { OAuthProvider, Role, Session } from '@/shared/api';
import { routeForSession, useAuthStore } from '@/shared/auth';

import { acquireIdToken, startGoogleSignIn } from './socialAuth';

/**
 * Drives the passwordless sign-in flow: ask for a code, then exchange it for a
 * session. The two halves are separate so the screen can show the code entry
 * between them. Errors surface to the caller rather than being swallowed.
 */
export function useSignIn({ navigate = true }: { navigate?: boolean } = {}) {
  const api = useApi();
  const router = useRouter();
  const persistSession = useAuthStore((state) => state.signIn);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(email: string) {
    setIsPending(true);
    setError(null);
    try {
      await api.requestSignInCode({ email });
      return true;
    } catch {
      setError('Could not send a code to that email. Please try again.');
      return false;
    } finally {
      setIsPending(false);
    }
  }

  /** Re-sends the code to the same address. */
  const resend = (email: string) => requestCode(email);

  async function signInWithCode(email: string, code: string) {
    setIsPending(true);
    setError(null);
    try {
      const session = await api.signInWithCode({ email, code });
      persistSession(session);
      if (navigate) router.replace(routeForSession(session));
      return session;
    } catch {
      setError('That code is invalid or has expired. Check it and try again.');
      return null;
    } finally {
      setIsPending(false);
    }
  }

  async function requestPhoneCode(phone: string) {
    setIsPending(true);
    setError(null);
    try {
      await api.requestPhoneCode({ phone });
      return true;
    } catch {
      setError('Could not send a code to that number. Please try again.');
      return false;
    } finally {
      setIsPending(false);
    }
  }

  const resendPhoneCode = (phone: string) => requestPhoneCode(phone);

  async function signInWithPhoneCode(phone: string, code: string, role: Role) {
    setIsPending(true);
    setError(null);
    try {
      const session = await api.verifyPhoneCode({ phone, code, role });
      persistSession(session);
      if (navigate) router.replace(routeForSession(session));
      return session;
    } catch {
      setError('That code is invalid or has expired. Check it and try again.');
      return null;
    } finally {
      setIsPending(false);
    }
  }

  return {
    requestCode,
    resend,
    signInWithCode,
    requestPhoneCode,
    resendPhoneCode,
    signInWithPhoneCode,
    isPending,
    error,
  };
}

/**
 * Step 2 of sign-up: registers the passwordless account and persists the unverified
 * session. Routing is deliberately left to the caller — the sign-up widget advances
 * to the code step instead of leaving for a separate screen.
 */
export function useSignUp() {
  const api = useApi();
  const persistSession = useAuthStore((state) => state.signIn);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp(email: string, role: Role) {
    setIsPending(true);
    setError(null);
    try {
      const session = await api.signUp({ email, role });
      persistSession(session);
      return session;
    } catch {
      setError('Could not create your account. Please try again.');
      return null;
    } finally {
      setIsPending(false);
    }
  }

  return { signUp, isPending, error };
}

export function useOAuthSignIn() {
  const api = useApi();
  const router = useRouter();
  const persistSession = useAuthStore((state) => state.signIn);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: OAuthProvider, role: Role) {
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

/**
 * Confirms the account's email with the 6-digit code. On success the persisted
 * session is refreshed (now verified) and handed back so the caller decides where to
 * go next — the sign-up widget continues to its final step, while the standalone
 * confirm-email screen routes home. A separate `resend` re-issues the code.
 */
export function useVerifyEmail() {
  const api = useApi();
  const persistSession = useAuthStore((state) => state.signIn);
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function verify(code: string): Promise<Session | null> {
    setIsPending(true);
    setError(null);
    try {
      const session = await api.verifyEmail({ code });
      persistSession(session);
      return session;
    } catch {
      setError('That code is invalid or has expired. Check it and try again.');
      return null;
    } finally {
      setIsPending(false);
    }
  }

  async function resend() {
    setIsResending(true);
    setError(null);
    setResent(false);
    try {
      await api.resendVerificationCode();
      setResent(true);
    } catch {
      setError('Could not resend the code. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  return { verify, resend, isPending, isResending, error, resent };
}

export function useRequestPasswordReset() {
  const api = useApi();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(email: string) {
    setIsPending(true);
    setError(null);
    try {
      await api.requestPasswordReset({ email });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      setError('Could not start a reset. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  return { request, isPending, error };
}

export function useResetPassword() {
  const api = useApi();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reset(email: string, code: string, newPassword: string) {
    setIsPending(true);
    setError(null);
    try {
      await api.resetPassword({ email, code, newPassword });
      router.replace('/sign-in');
    } catch {
      setError('That code is invalid or has expired. Request a new one and try again.');
    } finally {
      setIsPending(false);
    }
  }

  return { reset, isPending, error };
}
