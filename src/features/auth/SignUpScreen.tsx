'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { Role } from '@/shared/api';
import { routeForSession } from '@/shared/auth';

import { AuthTopShell } from './AuthShell';
import { StepAccount } from './StepAccount';
import { StepCode } from './StepCode';
import { StepDetails } from './StepDetails';
import { StepHeader } from './StepHeader';
import { useSignUp, useVerifyEmail } from './hooks';

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
  const { verify, resend, isPending: isVerifying, isResending, error: verifyError, resent } =
    useVerifyEmail();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>('brand');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);

  async function submitDetails() {
    const session = await signUp(email.trim(), role);
    if (session) setAwaitingCode(true);
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
        title={step === 1 ? undefined : awaitingCode ? 'Verify your email' : DETAILS_COPY[role].title}
        subtitle={
          step === 1
            ? 'Get paid to create. Get campaigns done.'
            : awaitingCode
              ? `We sent a 6-digit code to ${email.trim()}. Enter it below.`
              : DETAILS_COPY[role].subtitle
        }
      />

      {step === 1 ? (
        <StepAccount
          role={role}
          onRoleChange={setRole}
          email={email}
          onEmailChange={setEmail}
          onContinue={() => setStep(2)}
        />
      ) : awaitingCode ? (
        <StepCode
          onVerify={async (code) => {
            const session = await verify(code);
            if (!session) return;
            const path = routeForSession(session);
            // Step 3 is the profile setup screen, which opens with the name just given.
            router.replace(path.endsWith('/setup') ? `${path}?name=${encodeURIComponent(fullName.trim())}` : path);
          }}
          isPending={isVerifying}
          error={verifyError}
          onResend={resend}
          isResending={isResending}
          resent={resent}
          onUseDifferentEmail={() => setAwaitingCode(false)}
        />
      ) : (
        <StepDetails
          role={role}
          fullName={fullName}
          onFullNameChange={setFullName}
          email={email}
          onEmailChange={setEmail}
          onContinue={submitDetails}
          isPending={isPending}
          error={error ?? undefined}
        />
      )}

      {step === 2 ? (
        <p className="text-center text-xs text-text-tertiary">
          By continuing, you agree to Zeyoo&apos;s{' '}
          <Link href="/settings/legal" className="text-text-muted">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/settings/legal" className="text-text-muted">
            Privacy Policy
          </Link>
          .
        </p>
      ) : null}

      <Link
        href="/sign-in"
        aria-label={
          step === 1
            ? 'New here? Creating an account takes 30 seconds. Sign in.'
            : 'Already have an account? Sign in.'
        }
        className="self-center p-2 text-center text-xs text-text-muted"
      >
        {step === 1 ? 'New here? Creating an account takes 30 seconds… ' : 'Already have an account? '}
        <span className="font-medium text-green-text">Sign in</span>
      </Link>
    </AuthTopShell>
  );
}
