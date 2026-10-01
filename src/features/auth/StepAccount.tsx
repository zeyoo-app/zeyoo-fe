'use client';

import { Button, Field, SegmentedToggle } from '@/design-system';
import type { Role } from '@/shared/api';
import { isCompletePhone } from '@/shared/format/phone';

import { AuthChannelSwitch } from './AuthChannelSwitch';
import type { AuthChannel } from './channel';
import { PhoneInput } from './PhoneInput';
import { ROLE_OPTIONS } from './roleOptions';

interface StepAccountProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  channel: AuthChannel;
  onChannelChange: (channel: AuthChannel) => void;
  email: string;
  onEmailChange: (email: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  onContinue: () => void;
}

/** Step 1 — the account type and the address the code will be sent to. */
export function StepAccount({
  role,
  onRoleChange,
  channel,
  onChannelChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  onContinue,
}: StepAccountProps) {
  const isPhone = channel === 'phone';
  const canContinue = isPhone ? isCompletePhone(phone) : email.includes('@');

  return (
    <>
      <SegmentedToggle
        options={ROLE_OPTIONS}
        value={role}
        onChange={onRoleChange}
        ariaLabel="Are you creating a Company or a Creator account?"
      />

      {isPhone ? (
        <PhoneInput value={phone} onChange={onPhoneChange} />
      ) : (
        <Field
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      )}

      <Button disabled={!canContinue} onClick={onContinue}>
        Continue
      </Button>
      <AuthChannelSwitch value={channel} onChange={onChannelChange} />
    </>
  );
}
