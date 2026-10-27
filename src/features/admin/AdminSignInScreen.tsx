'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Field } from '@/design-system';
import { useApi } from '@/shared/api';
import { AuthShell } from '@/features/auth/AuthShell';
import { StepCode } from '@/features/auth/StepCode';
import { retryAfterSeconds } from '@/features/auth/retryAfter';
import { useCooldown } from '@/features/auth/useCooldown';

import { useStaffSession } from './staffSession';

/** The backend's own message when it has one, so staff see what actually went wrong. */
function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

/**
 * Back-office sign-in by emailed code. There is no sign-up: a super admin adds staff,
 * and the code request answers the same for any address, so it never reveals who
 * has access.
 */
export function AdminSignInScreen() {
  const api = useApi();
  const router = useRouter();
  const status = useStaffSession((state) => state.status);
  const signIn = useStaffSession((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { remaining, start } = useCooldown();
  const waitSeconds = retryAfterSeconds(error);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/admin/overview');
  }, [status, router]);

  useEffect(() => {
    if (waitSeconds !== null) start(waitSeconds);
  }, [waitSeconds, start, error]);

  async function sendCode(): Promise<boolean> {
    setIsPending(true);
    setError(null);
    try {
      await api.requestStaffCode(email.trim());
      return true;
    } catch (cause) {
      setError(messageOf(cause, 'We could not send a code. Try again.'));
      return false;
    } finally {
      setIsPending(false);
    }
  }

  async function verify(code: string) {
    setIsPending(true);
    setError(null);
    try {
      signIn(await api.verifyStaffCode({ email: email.trim(), code }));
      router.replace('/admin/overview');
    } catch (cause) {
      setError(messageOf(cause, 'That code is invalid or has expired. Check it and try again.'));
    } finally {
      setIsPending(false);
    }
  }

  const emailError =
    waitSeconds === null
      ? error
      : remaining > 0
        ? `Please wait ${remaining} ${remaining === 1 ? 'second' : 'seconds'} before requesting another code.`
        : null;

  return (
    <AuthShell tagline="Zeyoo back office">
      {awaitingCode ? (
        <>
          <p className="text-[15px] text-text-muted">
            If {email.trim()} has back-office access, a 6-digit code is on its way. Enter it below.
          </p>
          <StepCode
            onVerify={verify}
            isPending={isPending}
            error={error}
            onResend={() => void sendCode()}
            onUseDifferentIdentifier={() => {
              setAwaitingCode(false);
              setError(null);
            }}
          />
        </>
      ) : (
        <>
          <Field
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="you@zeyoo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError ?? undefined}
          />
          <Button
            loading={isPending}
            disabled={!email.includes('@') || isPending || remaining > 0}
            onClick={async () => {
              if (await sendCode()) setAwaitingCode(true);
            }}
          >
            Continue
          </Button>
        </>
      )}
    </AuthShell>
  );
}
