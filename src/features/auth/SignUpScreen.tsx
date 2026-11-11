'use client';

import { useEffect, useState } from 'react';
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
import { CHANNEL_NOUN, type AuthChannel } from './channel';
import { useSignIn } from './hooks';
import { clearSignUpHandoff, handedOffToSignUp } from './signUpHandoff';

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
 * verification code is not a step of its own — it renders inside step 2. The account
 * is created only when the code is verified, and the new session continues to profile setup.
 */
export function SignUpScreen() {
  const router = useRouter();
  const {
    requestCode,
    requestPhoneCode,
    signInWithCode,
    signInWithPhoneCode,
    isPending,
    error,
    notice,
  } = useSignIn({ navigate: false, intent: 'sign_up' });
  // An email or number sign-in found no account for arrives already filled in.
  const [handoff] = useState(handedOffToSignUp);
  useEffect(() => clearSignUpHandoff(), []);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>('brand');
  const [channel, setChannel] = useState<AuthChannel>(handoff?.channel ?? 'email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(handoff?.channel === 'email' ? handoff.value : '');
  const [phone, setPhone] = useState(handoff?.channel === 'phone' ? handoff.value : '');
  const [awaitingCode, setAwaitingCode] = useState(false);

  const isPhone = channel === 'phone';

  function switchChannel(next: AuthChannel) {
    setChannel(next);
    setAwaitingCode(false);
  }

  async function submitDetails() {
    const result = isPhone
      ? await requestPhoneCode(normalizePhone(phone))
      : await requestCode(email.trim());
    if (result === 'sent') setAwaitingCode(true);
  }

  function enterApp(session: Session) {
    const path = routeForSession(session);
    router.replace(path.endsWith('/setup') ? `${path}?name=${encodeURIComponent(fullName.trim())}` : path);
  }

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
            ? handoff
              ? `This ${CHANNEL_NOUN[handoff.channel].address} isn't registered yet. Choose an account type to create your account.`
              : 'Get paid to create. Get campaigns done.'
            : awaitingCode
              ? `${notice ?? `We sent a 6-digit code to ${isPhone ? normalizePhone(phone) : email.trim()}.`} Enter it below.`
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
          onVerify={async (code) => {
            const session = isPhone
              ? await signInWithPhoneCode(normalizePhone(phone), code, role)
              : await signInWithCode(email.trim(), code, role);
            if (session) enterApp(session);
          }}
          isPending={isPending}
          error={error}
          onResend={() =>
            void (isPhone ? requestPhoneCode(normalizePhone(phone)) : requestCode(email.trim()))
          }
          onUseDifferentIdentifier={() => setAwaitingCode(false)}
        />
      ) : (
        <StepDetails
          fullName={fullName}
          onFullNameChange={setFullName}
          channel={channel}
          email={email}
          onEmailChange={setEmail}
          phone={phone}
          onPhoneChange={setPhone}
          onContinue={submitDetails}
          isPending={isPending}
          error={error ?? undefined}
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
