import { Suspense } from 'react';

import { CreatorDirectoryScreen } from '@/features/campaigns/CreatorDirectoryScreen';

export default function Page() {
  // useSearchParams (the preselected campaign) needs a Suspense boundary in Next.js.
  return (
    <Suspense fallback={null}>
      <CreatorDirectoryScreen />
    </Suspense>
  );
}
