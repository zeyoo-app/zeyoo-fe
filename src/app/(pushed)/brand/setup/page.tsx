import { Suspense } from 'react';

import { BrandSetupScreen } from '@/features/profile/BrandSetupScreen';

/** First-run brand setup, pushed off the auth stack — no app shell. */
export default function Page() {
  return (
    <Suspense>
      <BrandSetupScreen />
    </Suspense>
  );
}
