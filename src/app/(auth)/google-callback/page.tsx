'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { completeGoogleSignIn } from '@/features/auth/socialAuth';
import { useApi } from '@/shared/api';
import { routeForSession, useAuthStore } from '@/shared/auth';

export default function Page() {
  const api = useApi();
  const router = useRouter();
  const persistSession = useAuthStore((state) => state.signIn);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const { idToken, role } = completeGoogleSignIn(window.location.hash);
        const session = await api.oauthSignIn({ provider: 'google', idToken, role });
        persistSession(session);
        router.replace(routeForSession(session));
      } catch {
        setFailed(true);
      }
    })();
  }, [api, persistSession, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-center text-sm text-text">
      {failed ? (
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
