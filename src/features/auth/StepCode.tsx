'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/design-system';

import { CodeInput } from './CodeInput';
import type { AuthChannel } from './channel';
import { formatCountdown, retryAfterSeconds } from './retryAfter';
import { useCooldown } from './useCooldown';

/** Matches the server: a new code can be requested 45 seconds after the last one. */
const RESEND_COOLDOWN_SECONDS = 45;

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
  const { remaining, start } = useCooldown();
  const waitSeconds = retryAfterSeconds(error);

  // The code that brought us here was only just sent, so the first resend is not yet allowed.
  useEffect(() => {
    start(RESEND_COOLDOWN_SECONDS);
  }, [start]);

  // The server said how long is left (for example after a double click): follow it.
  useEffect(() => {
    if (waitSeconds !== null) start(waitSeconds);
  }, [waitSeconds, start]);

  // A new code makes the digits typed for the old one meaningless, so start empty.
  const handleResend = () => {
    if (remaining > 0) return;
    setCode('');
    start(RESEND_COOLDOWN_SECONDS);
    onResend?.();
  };

  return (
    <>
      <CodeInput
        value={code}
        onChange={setCode}
        onComplete={onVerify}
        autoFocus
        error={error != null && waitSeconds === null}
      />

      {error && waitSeconds === null ? <p className="text-xs text-danger">{error}</p> : null}
      {resent ? <p className="text-xs text-green-text">A new code is on its way.</p> : null}

      <Button loading={isPending} disabled={code.length < 6 || isPending} onClick={() => onVerify(code)}>
        Verify
      </Button>

      <div className="flex flex-col items-center">
        {onResend ? (
          <button
            type="button"
            aria-label="Resend the verification code"
            disabled={isResending || remaining > 0}
            onClick={handleResend}
            className="px-2 py-3 text-[13px] font-semibold text-text underline underline-offset-2 disabled:opacity-60"
          >
            {isResending
              ? 'Sending…'
              : remaining > 0
                ? `Resend code in ${formatCountdown(remaining)}`
                : 'Resend code'}
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
