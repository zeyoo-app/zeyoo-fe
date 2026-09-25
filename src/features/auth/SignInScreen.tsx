'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button, Field } from '@/design-system';
import { useI18n } from '@/shared/i18n';

import { AuthShell, OrDivider } from './AuthShell';
import { SocialAuthButtons } from './SocialAuthButtons';
import { useSignIn } from './hooks';

export function SignInScreen() {
  const { t } = useI18n();
  const { signIn, isPending, error } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canContinue = email.includes('@') && password.length >= 8 && !isPending;

  return (
    <AuthShell tagline={t('auth.tagline')}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canContinue) signIn(email, password);
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
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" loading={isPending} disabled={!canContinue}>
          {t('auth.continue')}
        </Button>
      </form>

      <Link href="/forgot-password" className="self-end text-xs font-medium text-green-text">
        {t('auth.forgotPassword')}
      </Link>

      <OrDivider label={t('auth.or')} />
      <SocialAuthButtons role="creator" />

      <p className="text-center text-xs text-text-muted">
        {t('auth.newHere')}{' '}
        <Link href="/sign-up" className="font-medium text-green-text">
          {t('auth.createAccount')}
        </Link>
      </p>
    </AuthShell>
  );
}
