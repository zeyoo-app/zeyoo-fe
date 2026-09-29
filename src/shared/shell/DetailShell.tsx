'use client';

import type { ReactNode } from 'react';

import { useAuthStore, useRequireRole } from '@/shared/auth';

import { BackButton } from '../nav/BackButton';

interface DetailShellProps {
  /** When set, the screen is brand- or creator-only; anything else may open it. */
  role?: 'brand' | 'creator';
  /** Small line above the title — a step counter, a category, a section name. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Overrides history — for the setup screens, where "back" means leaving onboarding. */
  onBack?: () => void;
  children: ReactNode;
}

/**
 * The frame for a screen pushed off another screen: no app chrome, just a back
 * affordance, the title, and the body. This is the web equivalent of the mobile
 * root stack, where these screens sit outside the tab bar and are reached by
 * pushing onto the navigator.
 */
export function DetailShell({ role, eyebrow, title, subtitle, onBack, children }: DetailShellProps) {
  const session = useAuthStore((state) => state.session);
  // Guarding against the session's own role is what makes this work for the shared
  // screens (help, legal) as well as the role-specific ones.
  const { ready } = useRequireRole(role ?? session?.role ?? 'brand', { skipOnboarding: true });

  if (!ready) {
    return <div className="min-h-dvh bg-bg" aria-busy />;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 bg-bg px-4 py-8">
      <BackButton onPress={onBack} />
      <header>
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold text-text">{title}</h1>
        {subtitle ? <p className="mt-1 text-[15px] text-text-muted">{subtitle}</p> : null}
      </header>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
    </main>
  );
}
