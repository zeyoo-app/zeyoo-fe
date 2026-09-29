'use client';

import { Button, Field, SegmentedToggle } from '@/design-system';
import type { Role } from '@/shared/api';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'brand', label: 'Company' },
  { value: 'creator', label: 'Creator' },
];

interface StepAccountProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  email: string;
  onEmailChange: (email: string) => void;
  onContinue: () => void;
}

/** Step 1 — the account type and the address the code will be sent to. */
export function StepAccount({ role, onRoleChange, email, onEmailChange, onContinue }: StepAccountProps) {
  return (
    <>
      <SegmentedToggle
        options={ROLE_OPTIONS}
        value={role}
        onChange={onRoleChange}
        ariaLabel="Are you creating a Company or a Creator account?"
      />

      <div className="flex flex-col gap-1.5">
        <Field
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </div>

      <Button disabled={!email.includes('@')} onClick={onContinue}>
        Continue
      </Button>
    </>
  );
}
