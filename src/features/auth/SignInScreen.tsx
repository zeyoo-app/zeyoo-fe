'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button, Field } from '@/design-system';

import { AuthTopShell, OrDivider } from './AuthShell';
import { SocialAuthButtons } from './SocialAuthButtons';
import { StepCode } from './StepCode';
import { useSignIn } from './hooks';

/** Passwordless sign-in: an address, then the code we email to it. */
export function SignInScreen() {
  const { requestCode, signInWithCode, resend, isPending, error } = useSignIn();
  const [email, setEmail] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);

  async function submitEmail() {
    const sent = await requestCode(email.trim());
    if (sent) setAwaitingCode(true);
  }

  return (
    <AuthTopShell>
      {awaitingCode ? (
        <div className="flex flex-col gap-1.5 pt-2 pb-1">
          <h1 className="font-display text-2xl font-semibold text-text">Verify your email</h1>
          <p className="text-[15px] text-text-muted">
            We sent a 6-digit code to {email.trim()}. Enter it below.
          </p>
        </div>
      ) : (
        <p className="pb-2 text-[15px] text-text-muted">Get paid to create. Get campaigns done.</p>
      )}

      {awaitingCode ? (
        <StepCode
          onVerify={(code) => signInWithCode(email.trim(), code)}
          isPending={isPending}
          error={error}
          onResend={() => resend(email.trim())}
          onUseDifferentEmail={() => setAwaitingCode(false)}
        />
      ) : (
        <>
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error ?? undefined}
          />

          <Button
            loading={isPending}
            disabled={!email.includes('@') || isPending}
            onClick={submitEmail}
          >
            Continue
          </Button>

          <OrDivider label="or" />
          <SocialAuthButtons role="creator" />
        </>
      )}

      <Link
        href="/sign-up"
        aria-label="New here? Creating an account takes 30 seconds. Create an account."
        className="self-center p-2 text-center text-xs text-text-muted"
      >
        New here? Creating an account takes 30 seconds…{' '}
        <span className="font-medium text-green-text">Create an account</span>
      </Link>
    </AuthTopShell>
  );
}
