'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button, Field, SegmentedToggle } from '@/design-system';
import type { Role } from '@/shared/api';
import { useI18n } from '@/shared/i18n';

import { AuthShell, OrDivider } from './AuthShell';
import { SocialAuthButtons } from './SocialAuthButtons';
import { useSignUp } from './hooks';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'brand', label: 'Company' },
  { value: 'creator', label: 'Creator' },
];

export function SignUpScreen() {
  const { t } = useI18n();
  const { signUp, isPending, error } = useSignUp();
  const [role, setRole] = useState<Role>('creator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canContinue = email.includes('@') && password.length >= 8 && !isPending;

  return (
    <AuthShell tagline={t('auth.tagline')}>
      <SegmentedToggle
        options={ROLE_OPTIONS}
        value={role}
        onChange={setRole}
        ariaLabel="Are you creating a Company or a Creator account?"
      />

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canContinue) signUp(email, password, role);
        }}
      >
        <Field
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error ?? undefined}
        />
        <Field
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          placeholder="8+ characters"
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" loading={isPending} disabled={!canContinue}>
          {t('auth.createAccount')}
        </Button>
      </form>

      <OrDivider label={t('auth.or')} />
      <SocialAuthButtons role={role} />

      <p className="text-center text-xs text-text-muted">
        {t('auth.haveAccount')}{' '}
        <Link href="/sign-in" className="font-medium text-green-text">
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthShell>
  );
}
