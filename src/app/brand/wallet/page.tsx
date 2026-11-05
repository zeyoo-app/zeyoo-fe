import { Suspense } from 'react';

import { BrandWalletScreen } from '@/features/earnings/BrandWalletScreen';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BrandWalletScreen />
    </Suspense>
  );
}
