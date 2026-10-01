'use client';

import { Lock } from 'lucide-react';

import { Button, Card } from '@/design-system';
import { DetailShell } from '@/shared/shell';

import { useAddPaymentMethod } from '../earnings/hooks';

/** Sends the brand to Stripe's hosted page to save a card; card details never touch Zeyoo. */
export function AddPaymentMethodScreen() {
  const addPaymentMethod = useAddPaymentMethod();

  return (
    <DetailShell
      role="brand"
      title="Add payment method"
      subtitle="Used to fund your campaigns and pay creators."
    >
      <Card className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm text-text">
          <Lock className="size-4 text-text-muted" aria-hidden />
          Secure card entry by Stripe
        </p>
        <p className="text-xs text-text-muted">
          You will be taken to Stripe to enter your card, then returned here. Zeyoo never sees or
          stores your full card number.
        </p>
      </Card>

      {addPaymentMethod.error ? (
        <p className="text-xs text-danger">
          {addPaymentMethod.error instanceof Error
            ? addPaymentMethod.error.message
            : 'Could not start card setup.'}
        </p>
      ) : null}

      <Button loading={addPaymentMethod.isPending} onClick={() => addPaymentMethod.mutate()}>
        Continue to Stripe
      </Button>
    </DetailShell>
  );
}
