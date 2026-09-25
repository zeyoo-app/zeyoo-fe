'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Button, Field } from '@/design-system';

import { AuthShell } from './AuthShell';
import { CodeInput } from './CodeInput';
import { useResetPassword } from './hooks';

export function ResetPasswordScreen() {
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const { reset, isPending, error } = useResetPassword();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = code.length === 6 && password.length >= 8 && !isPending;

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-text">Set a new password</h1>
        <p className="mt-2 text-sm text-text-muted">
          Enter the 6-digit code sent to {email || 'your email'} and choose a new password.
        </p>
      </div>

      <CodeInput value={code} onChange={setCode} autoFocus error={error != null} />

      <Field
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder="8+ characters"
        maxLength={128}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={error ?? undefined}
      />

      <Button
        loading={isPending}
        disabled={!canSubmit}
        onClick={() => reset(email, code, password)}
      >
        Reset password
      </Button>
    </AuthShell>
  );
}
