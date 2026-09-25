'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useApi } from '@/shared/api';
import type { OAuthProvider, Role } from '@/shared/api';
import { homePathForRole, useAuthStore } from '@/shared/auth';

import { acquireIdToken } from './socialAuth';

function routeAfterAuth(router: ReturnType<typeof useRouter>, role: Role, emailVerified: boolean): void {
  router.replace(emailVerified ? homePathForRole(role) : '/confirm-email');
}

export function useSignIn() {
  const api = useApi();
  const router = useRouter();
  const persistSession = useAuthStore((state) => state.signIn);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(email: string, password: string) {
    setIsPending(true);
    setError(null);
    try {
      const session = await api.signIn({ email, password });
      persistSession(session);
      routeAfterAuth(router, session.role, session.emailVerified);
    } catch {
      setError('Could not sign you in. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  return { signIn, isPending, error };
}

export function useSignUp() {
  const api = useApi();
  const router = useRouter();
  const persistSession = useAuthStore((state) => state.signIn);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp(email: string, password: string, role: Role) {
    setIsPending(true);
    setError(null);
    try {
      const session = await api.signUp({ email, password, role });
      persistSession(session);
      routeAfterAuth(router, session.role, session.emailVerified);
    } catch {
      setError('Could not create your account. Please try again.');
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
      const idToken = await acquireIdToken(provider);
      const session = await api.oauthSignIn({ provider, idToken, role });
      persistSession(session);
      routeAfterAuth(router, session.role, session.emailVerified);
    } catch {
      setError(`Could not sign in with ${provider === 'apple' ? 'Apple' : 'Google'}. Please try again.`);
    } finally {
      setPendingProvider(null);
    }
  }

  return { signInWith, pendingProvider, error };
}

export function useVerifyEmail() {
  const api = useApi();
  const router = useRouter();
  const persistSession = useAuthStore((state) => state.signIn);
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function verify(code: string) {
    setIsPending(true);
    setError(null);
    try {
      const session = await api.verifyEmail({ code });
      persistSession(session);
      router.replace(homePathForRole(session.role));
    } catch {
      setError('That code is invalid or has expired. Check it and try again.');
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
