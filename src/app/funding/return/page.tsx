import { Suspense } from 'react';

import { FundingReturnScreen } from '@/features/campaigns/FundingReturnScreen';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FundingReturnScreen />
    </Suspense>
  );
}
