import Link from 'next/link';
import type { ReactNode } from 'react';

import { Logo } from '@/design-system';

/** Centered card layout shared by every auth screen. */
export function AuthShell({ children, tagline }: { children: ReactNode; tagline?: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" aria-label="Zeyoo home">
            <Logo height={30} />
          </Link>
          {tagline ? <p className="text-sm text-text-muted">{tagline}</p> : null}
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </main>
  );
}

/**
 * The opening layout of sign-up and sign-in: a left-aligned wordmark at the top of
 * the page, the steps flowing under it. The first step leads with the logo instead of
 * a back button, so nothing is centered.
 */
export function AuthTopShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-4 py-12">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-4">
        <Link href="/" aria-label="Zeyoo home" className="w-fit">
          <Logo height={37} />
        </Link>
        {children}
      </div>
    </main>
  );
}

/** A hairline rule with a centred word, separating primary auth from social. */
export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
