'use client';

import { Loader2 } from 'lucide-react';

import type { Role } from '@/shared/api';
import { useI18n } from '@/shared/i18n';

import { GoogleIcon } from './BrandIcons';
import { useOAuthSignIn } from './hooks';

/** Google sign-in. The chosen role applies only to brand-new accounts. */
export function SocialAuthButtons({ role }: { role: Role }) {
  const { t } = useI18n();
  const { signInWith, pendingProvider, error } = useOAuthSignIn();
  const busy = pendingProvider !== null;

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => signInWith('google', role)}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface text-[15px] font-medium text-text transition-colors hover:bg-surface-hover disabled:opacity-45"
      >
        {pendingProvider === 'google' ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
        {t('auth.google')}
      </button>

      {error ? <p className="text-center text-xs text-danger">{error}</p> : null}
    </div>
  );
}
