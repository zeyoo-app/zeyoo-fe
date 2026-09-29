'use client';

import { useState } from 'react';

import { Button } from '@/design-system';

import { CodeInput } from './CodeInput';

interface StepCodeProps {
  /** Performs the exchange behind the code — confirming an address or signing in. */
  onVerify: (code: string) => void;
  isPending?: boolean;
  error?: string | null;
  onResend?: () => void;
  isResending?: boolean;
  resent?: boolean;
  onUseDifferentEmail: () => void;
}

/**
 * The six-digit code entry. Rendered inline wherever a code is asked for — inside
 * the sign-up widget's details step, and on the sign-in screen — rather than as a
 * step of its own.
 */
export function StepCode({
  onVerify,
  isPending = false,
  error = null,
  onResend,
  isResending = false,
  resent = false,
  onUseDifferentEmail,
}: StepCodeProps) {
  const [code, setCode] = useState('');

  return (
    <>
      <CodeInput value={code} onChange={setCode} onComplete={onVerify} autoFocus error={error != null} />

      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {resent ? <p className="text-xs text-green-text">A new code is on its way.</p> : null}

      <Button loading={isPending} disabled={code.length < 6 || isPending} onClick={() => onVerify(code)}>
        Verify
      </Button>

      {onResend ? (
        <button
          type="button"
          aria-label="Resend the verification code"
          disabled={isResending}
          onClick={onResend}
          className="self-center p-2 text-xs text-text-muted disabled:opacity-60"
        >
          Didn&apos;t get it?{' '}
          <span className="font-medium text-green-text">{isResending ? 'Sending…' : 'Resend code'}</span>
        </button>
      ) : null}

      <button
        type="button"
        aria-label="Use a different email"
        onClick={onUseDifferentEmail}
        className="self-center p-2 text-xs text-text-tertiary"
      >
        Use a different email
      </button>
    </>
  );
}
