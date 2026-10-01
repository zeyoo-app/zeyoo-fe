'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { Role, Session } from '@/shared/api';
import { routeForSession } from '@/shared/auth';
import { normalizePhone } from '@/shared/format/phone';

import { AuthTopShell } from './AuthShell';
import { StepAccount } from './StepAccount';
import { StepCode } from './StepCode';
import { StepDetails } from './StepDetails';
import { StepHeader } from './StepHeader';
import type { AuthChannel } from './channel';
import { useSignIn, useSignUp, useVerifyEmail } from './hooks';

const TOTAL_STEPS = 3;

const DETAILS_COPY: Record<Role, { title: string; subtitle: string }> = {
  brand: {
    title: 'Create Brand Account',
    subtitle: 'Create your account to launch campaigns and reward creators.',
  },
  creator: {
    title: 'Create Creator Account',
    subtitle: 'Create your account to get paid by the brands you love.',
  },
};

/**
 * Sign-up as a three-step widget: pick the account type, then the details. The
 * verification code is not a step of its own — it renders inside step 2 once the
 * account exists, and the confirmed session continues to profile setup.
 */
export function SignUpScreen() {
  const router = useRouter();
  const { signUp, isPending, error } = useSignUp();
  const {
    requestPhoneCode,
    signInWithPhoneCode,
    isPending: isVerifyingPhone,
    error: phoneError,
  } = useSignIn({ navigate: false });
  const { verify, resend, isPending: isVerifyingEmail, isResending, error: emailVerifyError, resent } =
    useVerifyEmail();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>('brand');
  const [channel, setChannel] = useState<AuthChannel>('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);

  const isPhone = channel === 'phone';

  function switchChannel(next: AuthChannel) {
    setChannel(next);
    setAwaitingCode(false);
  }

  async function submitDetails() {
    if (isPhone) {
      const sent = await requestPhoneCode(normalizePhone(phone));
      if (sent) setAwaitingCode(true);
      return;
    }
    const session = await signUp(email.trim(), role);
    if (session) setAwaitingCode(true);
  }

  function enterApp(session: Session) {
    const path = routeForSession(session);
    router.replace(path.endsWith('/setup') ? `${path}?name=${encodeURIComponent(fullName.trim())}` : path);
  }

  const codeError = isPhone ? phoneError : emailVerifyError;

  return (
    <AuthTopShell>
      <StepHeader
        // The creator onboarding is a three-step flow: account, verification,
        // then profile setup. The indicator stays on the account step so the
        // verification step doesn't look skipped.
        step={step}
        total={TOTAL_STEPS}
        onBack={step === 2 ? () => setStep(1) : undefined}
        title={
          step === 1
            ? undefined
            : awaitingCode
              ? `Verify your ${isPhone ? 'phone number' : 'email'}`
              : DETAILS_COPY[role].title
        }
        subtitle={
          step === 1
            ? 'Get paid to create. Get campaigns done.'
            : awaitingCode
              ? `We sent a 6-digit code to ${isPhone ? normalizePhone(phone) : email.trim()}. Enter it below.`
              : DETAILS_COPY[role].subtitle
        }
      />

      {step === 1 ? (
        <StepAccount
          role={role}
          onRoleChange={setRole}
          channel={channel}
          onChannelChange={switchChannel}
          email={email}
          onEmailChange={setEmail}
          phone={phone}
          onPhoneChange={setPhone}
          onContinue={() => setStep(2)}
        />
      ) : awaitingCode ? (
        <StepCode
          channel={channel}
          onVerify={
            isPhone
              ? async (code) => {
                  const session = await signInWithPhoneCode(normalizePhone(phone), code, role);
                  if (session) enterApp(session);
                }
              : async (code) => {
                  const session = await verify(code);
                  if (session) enterApp(session);
                }
          }
          isPending={isPhone ? isVerifyingPhone : isVerifyingEmail}
          error={codeError}
          onResend={isPhone ? () => void requestPhoneCode(normalizePhone(phone)) : resend}
          isResending={isResending}
          resent={resent}
          onUseDifferentIdentifier={() => setAwaitingCode(false)}
        />
      ) : (
        <StepDetails
          role={role}
          fullName={fullName}
          onFullNameChange={setFullName}
          channel={channel}
          email={email}
          onEmailChange={setEmail}
          phone={phone}
          onPhoneChange={setPhone}
          onContinue={submitDetails}
          isPending={isPending || (isPhone && isVerifyingPhone)}
          error={(isPhone ? phoneError : error) ?? undefined}
        />
      )}

      {step === 1 ? (
        <Link
          href="/sign-in"
          aria-label="New here? Creating an account takes 30 seconds. Sign in."
          className="self-center p-2 text-center text-xs text-text-muted"
        >
          New here? Creating an account takes 30 seconds…{' '}
          <span className="font-medium text-green-text">Sign in</span>
        </Link>
      ) : null}
    </AuthTopShell>
  );
}
