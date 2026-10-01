'use client';

import { Button, Field } from '@/design-system';
import type { Role } from '@/shared/api';
import { isCompletePhone } from '@/shared/format/phone';

import { OrDivider } from './AuthShell';
import { CHANNEL_NOUN, type AuthChannel } from './channel';
import { PhoneInput } from './PhoneInput';
import { SocialAuthButtons } from './SocialAuthButtons';

interface StepDetailsProps {
  role: Role;
  fullName: string;
  onFullNameChange: (value: string) => void;
  channel: AuthChannel;
  email: string;
  onEmailChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  onContinue: () => void;
  isPending: boolean;
  error?: string;
}

/**
 * Step 2 — the account details. Continuing registers the passwordless account,
 * which is when the verification code goes out.
 */
export function StepDetails({
  role,
  fullName,
  onFullNameChange,
  channel,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  onContinue,
  isPending,
  error,
}: StepDetailsProps) {
  const isPhone = channel === 'phone';
  const hasIdentifier = isPhone ? isCompletePhone(phone) : email.includes('@');
  const valid = fullName.trim().length >= 2 && hasIdentifier && !isPending;

  return (
    <>
      <SocialAuthButtons role={role} />

      <OrDivider label={isPhone ? 'or continue with your phone' : 'or continue with work email'} />

      <div className="flex flex-col gap-1.5">
        <Field
          label="Full name"
          autoComplete="name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(event) => onFullNameChange(event.target.value)}
        />
      </div>

      {isPhone ? (
        <PhoneInput value={phone} onChange={onPhoneChange} />
      ) : (
        <div className="flex flex-col gap-1.5">
          <Field
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
          <p className="text-xs text-text-tertiary">We&apos;ll send a verification code to this email.</p>
        </div>
      )}

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <Button loading={isPending} disabled={!valid} onClick={onContinue}>
        Continue with your {CHANNEL_NOUN[channel].address}
      </Button>
    </>
  );
}
