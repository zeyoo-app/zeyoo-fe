import { Suspense } from 'react';

import { CreatorSetupScreen } from '@/features/profile/CreatorSetupScreen';

/** First-run creator setup, pushed off the auth stack — no app shell. */
export default function Page() {
  return (
    <Suspense>
      <CreatorSetupScreen />
    </Suspense>
  );
}
