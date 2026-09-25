'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button, Field } from '@/design-system';

import { AuthShell } from './AuthShell';
import { useRequestPasswordReset } from './hooks';

export function ForgotPasswordScreen() {
  const { request, isPending, error } = useRequestPasswordReset();
  const [email, setEmail] = useState('');
  const canContinue = email.includes('@') && !isPending;

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-text">Reset password</h1>
        <p className="mt-2 text-sm text-text-muted">
          Enter your email and we&apos;ll send a 6-digit code to reset your password.
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canContinue) request(email);
        }}
      >
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" loading={isPending} disabled={!canContinue}>
          Send reset code
        </Button>
      </form>

      <Link href="/sign-in" className="text-center text-xs font-medium text-green-text">
        Back to sign in
      </Link>
    </AuthShell>
  );
}
