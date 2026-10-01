'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button, Field, SegmentedToggle } from '@/design-system';
import type { Role } from '@/shared/api';
import { isCompletePhone, normalizePhone } from '@/shared/format/phone';

import { AuthTopShell, OrDivider } from './AuthShell';
import { AuthChannelSwitch } from './AuthChannelSwitch';
import type { AuthChannel } from './channel';
import { PhoneInput } from './PhoneInput';
import { ROLE_OPTIONS } from './roleOptions';
import { SocialAuthButtons } from './SocialAuthButtons';
import { StepCode } from './StepCode';
import { useSignIn } from './hooks';

/** Passwordless sign-in through either an emailed or texted one-time code. */
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
  } = useSignIn();
  const [channel, setChannel] = useState<AuthChannel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [awaitingCode, setAwaitingCode] = useState(false);

  const isPhone = channel === 'phone';
  const canContinue = isPhone ? isCompletePhone(phone) : email.includes('@');

  async function submitIdentifier() {
    const sent = isPhone
      ? await requestPhoneCode(normalizePhone(phone))
      : await requestCode(email.trim());
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
            We sent a 6-digit code to {isPhone ? normalizePhone(phone) : email.trim()}. Enter it below.
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
              ? signInWithPhoneCode(normalizePhone(phone), code, role)
              : signInWithCode(email.trim(), code)
          }
          isPending={isPending}
          error={error}
          onResend={() =>
            isPhone ? resendPhoneCode(normalizePhone(phone)) : resend(email.trim())
          }
          onUseDifferentIdentifier={() => setAwaitingCode(false)}
        />
      ) : (
        <>
          {isPhone ? (
            <SegmentedToggle
              options={ROLE_OPTIONS}
              value={role}
              onChange={setRole}
              ariaLabel="Are you signing in as a Company or a Creator?"
            />
          ) : null}

          {isPhone ? (
            <PhoneInput value={phone} onChange={setPhone} error={error} />
          ) : (
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error ?? undefined}
            />
          )}

          <Button
            loading={isPending}
            disabled={!canContinue || isPending}
            onClick={submitIdentifier}
          >
            Continue
          </Button>
          <AuthChannelSwitch value={channel} onChange={switchChannel} />

          <OrDivider label="or" />
          <SocialAuthButtons role="creator" />
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
