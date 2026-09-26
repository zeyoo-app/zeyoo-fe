'use client';

import { useEffect, type ReactNode } from 'react';

import { ApiProvider } from '@/shared/api';
import { useAuthStore } from '@/shared/auth';
import { I18nProvider } from '@/shared/i18n';
import { ConfirmProvider, ThemeProvider } from '@/design-system';

function AuthHydrator({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}

/** Client provider stack for the whole app: theme, locale, API/query, auth hydration. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ApiProvider>
          <ConfirmProvider>
            <AuthHydrator>{children}</AuthHydrator>
          </ConfirmProvider>
        </ApiProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
