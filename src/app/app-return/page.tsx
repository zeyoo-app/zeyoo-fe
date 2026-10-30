import { Suspense } from 'react';

import { AppReturnScreen } from '@/features/links/AppReturnScreen';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AppReturnScreen />
    </Suspense>
  );
}
