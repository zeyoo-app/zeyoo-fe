'use client';

import { useState } from 'react';

import { Button } from '@/design-system';

import { CodeInput } from './CodeInput';
import type { AuthChannel } from './channel';

interface StepCodeProps {
  /** Performs the exchange behind the code — confirming an address or signing in. */
  onVerify: (code: string) => void;
  isPending?: boolean;
  error?: string | null;
  onResend?: () => void;
  isResending?: boolean;
  resent?: boolean;
  channel?: AuthChannel;
  onUseDifferentIdentifier: () => void;
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
  channel = 'email',
  onUseDifferentIdentifier,
}: StepCodeProps) {
  const [code, setCode] = useState('');
  const identifierLabel = channel === 'email' ? 'email address' : 'phone number';

  return (
    <>
      <CodeInput value={code} onChange={setCode} onComplete={onVerify} autoFocus error={error != null} />

      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {resent ? <p className="text-xs text-green-text">A new code is on its way.</p> : null}

      <Button loading={isPending} disabled={code.length < 6 || isPending} onClick={() => onVerify(code)}>
        Verify
      </Button>

      <div className="flex flex-col items-center">
        {onResend ? (
          <button
            type="button"
            aria-label="Resend the verification code"
            disabled={isResending}
            onClick={onResend}
            className="px-2 py-3 text-[13px] font-semibold text-text underline underline-offset-2 disabled:opacity-60"
          >
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
        ) : null}

        <button
          type="button"
          aria-label={`Change ${identifierLabel}`}
          onClick={onUseDifferentIdentifier}
          className="px-2 py-3 text-[13px] font-semibold text-text underline underline-offset-2"
        >
          Change {identifierLabel}
        </button>
      </div>
    </>
  );
}
