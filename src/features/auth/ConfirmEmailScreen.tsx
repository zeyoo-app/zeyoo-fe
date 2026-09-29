'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/design-system';
import { routeForSession, useAuthStore } from '@/shared/auth';

import { AuthShell } from './AuthShell';
import { CodeInput } from './CodeInput';
import { useVerifyEmail } from './hooks';

export function ConfirmEmailScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const { verify, resend, isPending, isResending, error, resent } = useVerifyEmail();
  const [code, setCode] = useState('');

  const useDifferentAccount = () => {
    signOut();
    router.replace('/sign-in');
  };

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-text">Confirm your email</h1>
        <p className="mt-2 text-sm text-text-muted">
          We sent a 6-digit code to your inbox. Enter it below to activate your account.
        </p>
      </div>

      <CodeInput
        value={code}
        onChange={setCode}
        onComplete={async (value) => {
          const session = await verify(value);
          if (session) router.replace(routeForSession(session));
        }}
        autoFocus
        error={error != null}
      />

      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {resent ? <p className="text-xs text-green-text">A new code is on its way.</p> : null}

      <Button
        loading={isPending}
        disabled={code.length < 6 || isPending}
        onClick={async () => {
          const session = await verify(code);
          if (session) router.replace(routeForSession(session));
        }}
      >
        Verify
      </Button>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={resend}
          disabled={isResending}
          className="text-xs text-text-muted disabled:opacity-60"
        >
          Didn&apos;t get it?{' '}
          <span className="font-medium text-green-text">{isResending ? 'Sending…' : 'Resend code'}</span>
        </button>
        <button onClick={useDifferentAccount} className="text-xs text-text-tertiary">
          Use a different account
        </button>
      </div>
    </AuthShell>
  );
}
