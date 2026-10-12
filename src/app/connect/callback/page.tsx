'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useApi } from '@/shared/api';

const APP_CONNECT_URL = 'zeyoo://connect';

/**
 * Where Instagram and TikTok send a creator after they authorise. The signed `state`
 * records which client started the flow: the mobile app is handed the code through
 * its deep link, and the web app finishes the connection right here.
 */
export default function Page() {
  const api = useApi();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [returningToApp, setReturningToApp] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      if (!code || !state || params.get('error')) {
        setFailed(true);
        return;
      }
      if (clientFromState(state) === 'app') {
        setReturningToApp(true);
        window.location.replace(`${APP_CONNECT_URL}?${params.toString()}`);
        return;
      }
      try {
        await api.completePlatformConnection({ code, state });
        router.replace('/creator/connected-accounts');
      } catch {
        setFailed(true);
      }
    })();
  }, [api, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-center text-sm text-text">
      {failed ? (
        <p>
          We couldn&apos;t connect your account.{' '}
          <Link href="/creator/connected-accounts" className="underline">
            Back to connected accounts
          </Link>
        </p>
      ) : (
        <p>{returningToApp ? 'Returning to the Zeyoo app…' : 'Connecting your account…'}</p>
      )}
    </main>
  );
}

/** The state is `base64url(json).signature`; the payload is readable, the signature is checked server-side. */
function clientFromState(state: string): 'web' | 'app' {
  try {
    const payload = JSON.parse(atob(state.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.client === 'app' ? 'app' : 'web';
  } catch {
    return 'web';
  }
}
