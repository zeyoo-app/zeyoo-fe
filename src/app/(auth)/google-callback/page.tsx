'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/design-system';
import { AuthShell } from '@/features/auth/AuthShell';
import { completeGoogleSignIn } from '@/features/auth/socialAuth';
import { API_ERROR, errorCodeOf, useApi } from '@/shared/api';
import type { Role } from '@/shared/api';
import { routeAfterSignIn, useAuthStore } from '@/shared/auth';

type Stage = 'signing-in' | 'choose-role' | 'failed';

/**
 * Where Google sends the browser back. A returning user goes straight in. A brand-new
 * Google account that came from sign-in (no role chosen) is asked here which kind of
 * account to create, and the same ID token is retried with that choice.
 */
export default function Page() {
  const api = useApi();
  const router = useRouter();
  const persistSession = useAuthStore((state) => state.signIn);
  const [stage, setStage] = useState<Stage>('signing-in');
  const [error, setError] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const idToken = useRef<string | null>(null);
  const started = useRef(false);

  async function exchange(token: string, role?: Role) {
    const session = await api.oauthSignIn({ provider: 'google', idToken: token, role });
    persistSession(session);
    router.replace(routeAfterSignIn(session));
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const { idToken: token, role } = completeGoogleSignIn(window.location.hash);
        idToken.current = token;
        await exchange(token, role);
      } catch (cause) {
        if (errorCodeOf(cause) === API_ERROR.accountTypeRequired && idToken.current) {
          setStage('choose-role');
        } else {
          setStage('failed');
        }
      }
    })();
    // Runs once per redirect; `exchange` only closes over stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function choose(role: Role) {
    if (!idToken.current) return;
    setPendingRole(role);
    setError(null);
    try {
      await exchange(idToken.current, role);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create your account. Please try again.');
      setPendingRole(null);
    }
  }

  if (stage === 'choose-role') {
    return (
      <AuthShell>
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="font-display text-2xl font-semibold text-text">Create your account</h1>
          <p className="text-[15px] text-text-muted">
            There is no Zeyoo account for this Google account yet. How will you use Zeyoo?
          </p>
        </div>
        <Button loading={pendingRole === 'creator'} disabled={pendingRole !== null} onClick={() => choose('creator')}>
          I&apos;m a creator
        </Button>
        <Button
          variant="secondary"
          loading={pendingRole === 'brand'}
          disabled={pendingRole !== null}
          onClick={() => choose('brand')}
        >
          I&apos;m a brand
        </Button>
        {error ? <p className="text-center text-xs text-danger">{error}</p> : null}
        <Link href="/sign-in" className="self-center p-2 text-xs text-text-muted">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-center text-sm text-text">
      {stage === 'failed' ? (
        <p>
          Could not sign in with Google.{' '}
          <Link href="/sign-in" className="underline">
            Back to sign in
          </Link>
        </p>
      ) : (
        <p>Signing you in…</p>
      )}
    </main>
  );
}
