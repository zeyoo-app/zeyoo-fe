'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Button, Field } from '@/design-system';
import { isCompletePhone, normalizePhone } from '@/shared/format/phone';

import { AuthTopShell, OrDivider } from './AuthShell';
import { AuthChannelSwitch } from './AuthChannelSwitch';
import type { AuthChannel } from './channel';
import { PhoneInput } from './PhoneInput';
import { retryAfterSeconds } from './retryAfter';
import { useCooldown } from './useCooldown';
import { SocialAuthButtons } from './SocialAuthButtons';
import { StepCode } from './StepCode';
import { useSignIn } from './hooks';

/**
 * Passwordless sign-in through an emailed or texted one-time code. It never creates
 * an account: an address or number with none stays here with a clear message and a
 * way to create one.
 */
export function SignInScreen() {
  const {
    requestCode,
    signInWithCode,
    resend,
    requestPhoneCode,
    signInWithPhoneCode,
    resendPhoneCode,
    isPending,
    error,
    notice,
    accountMissing,
  } = useSignIn({ intent: 'sign_in' });
  const [channel, setChannel] = useState<AuthChannel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);

  const { remaining, start } = useCooldown();
  const waitSeconds = retryAfterSeconds(error);
  useEffect(() => {
    if (waitSeconds !== null) start(waitSeconds);
  }, [waitSeconds, start, error]);
  // While the server is making us wait, show the live countdown instead of the frozen message.
  const identifierError = accountMissing
    ? null
    : waitSeconds === null
      ? error
      : remaining > 0
        ? `Please wait ${remaining} ${remaining === 1 ? 'second' : 'seconds'} before requesting another code.`
        : null;

  const isPhone = channel === 'phone';
  const canContinue = isPhone ? isCompletePhone(phone) : email.includes('@');

  async function submitIdentifier() {
    const sent = isPhone ? await requestPhoneCode(normalizePhone(phone)) : await requestCode(email.trim());
    if (sent) setAwaitingCode(true);
  }

  function switchChannel(next: AuthChannel) {
    setChannel(next);
    setAwaitingCode(false);
  }

  return (
    <AuthTopShell>
      {awaitingCode ? (
        <div className="flex flex-col gap-1.5 pt-2 pb-1">
          <h1 className="font-display text-2xl font-semibold text-text">
            Verify your {isPhone ? 'phone number' : 'email'}
          </h1>
          <p className="text-[15px] text-text-muted">
            {notice ?? `We sent a 6-digit code to ${isPhone ? normalizePhone(phone) : email.trim()}.`} Enter
            it below.
          </p>
        </div>
      ) : (
        <p className="pb-2 text-[15px] text-text-muted">Get paid to create. Get campaigns done.</p>
      )}

      {awaitingCode ? (
        <StepCode
          channel={channel}
          onVerify={(code) =>
            isPhone
              ? signInWithPhoneCode(normalizePhone(phone), code)
              : signInWithCode(email.trim(), code)
          }
          isPending={isPending}
          error={error}
          onResend={() => (isPhone ? resendPhoneCode(normalizePhone(phone)) : resend(email.trim()))}
          onUseDifferentIdentifier={() => setAwaitingCode(false)}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            <SocialAuthButtons />
            <AuthChannelSwitch value={channel} onChange={switchChannel} />
          </div>

          <OrDivider label="or" />

          {accountMissing ? (
            <div role="alert" className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
              <p className="text-[15px] font-semibold text-text">No account found</p>
              <p className="text-sm text-text-muted">{error}</p>
              <Button size="sm" href="/sign-up" className="mt-1">
                Create an account
              </Button>
            </div>
          ) : null}

          {isPhone ? (
            <PhoneInput value={phone} onChange={setPhone} error={identifierError} />
          ) : (
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={identifierError ?? undefined}
            />
          )}

          <Button
            loading={isPending}
            disabled={!canContinue || isPending || remaining > 0}
            onClick={submitIdentifier}
          >
            Continue
          </Button>
        </>
      )}

      {!awaitingCode ? (
        <Link
          href="/sign-up"
          aria-label="New here? Creating an account takes 30 seconds. Create an account."
          className="self-center p-2 text-center text-xs text-text-muted"
        >
          New here? Creating an account takes 30 seconds…{' '}
          <span className="font-medium text-green-text">Create an account</span>
        </Link>
      ) : null}
    </AuthTopShell>
  );
}
