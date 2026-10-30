'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const APP_SCHEME = 'zeyoo://';

/**
 * Where a hosted page the mobile app opened (Stripe checkout, card setup, payout
 * onboarding) sends the person back. A redirect inside the browser does not open a
 * universal link by itself, so this page hands the destination to the app over its
 * zeyoo:// scheme, with buttons in case the browser asks first or the app is missing.
 */
export function AppReturnScreen() {
  const params = useSearchParams();
  const destination = useMemo(() => safeInternalPath(params.get('to')), [params]);
  const appUrl = `${APP_SCHEME}${destination.slice(1)}`;

  useEffect(() => {
    window.location.replace(appUrl);
  }, [appUrl]);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-center text-text">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <Image src="/brand/logo-mark.png" alt="Zeyoo" width={56} height={57} priority />
        <h1 className="font-display text-xl font-semibold">Returning you to Zeyoo</h1>
        <p className="text-sm text-text-muted">
          If the app does not open on its own, tap the button below.
        </p>
        <a
          href={appUrl}
          className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary"
        >
          Open the Zeyoo app
        </a>
        <Link href={destination} className="text-sm text-text-muted underline">
          Continue on the website instead
        </Link>
      </div>
    </main>
  );
}

/** Only a same-site path is accepted, so this page can never forward somewhere else. */
function safeInternalPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/';
  }
  return value;
}
