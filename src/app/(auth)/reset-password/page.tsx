import { Suspense } from 'react';

import { ResetPasswordScreen } from '@/features/auth/ResetPasswordScreen';

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordScreen />
    </Suspense>
  );
}
