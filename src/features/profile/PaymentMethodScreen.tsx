'use client';

import { useRouter } from 'next/navigation';
import { CreditCard, Lock } from 'lucide-react';

import { AsyncContent, Button, Card, Divider } from '@/design-system';
import { formatMoney } from '@/shared/money/money';
import { DetailShell } from '@/shared/shell';

import { useBrandBilling } from '../earnings/hooks';

/** Brand payment method: the default card used to fund campaigns. */
export function PaymentMethodScreen() {
  const router = useRouter();
  const billing = useBrandBilling();

  return (
    <DetailShell
      role="brand"
      title="Payment Method"
      subtitle="The card Zeyoo charges when you fund a campaign."
    >
      <AsyncContent
        isLoading={billing.isLoading}
        isError={billing.isError}
        data={billing.data}
      >
        {(data) => (
          <>
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised">
                  <CreditCard className="size-[18px] text-text" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-text">
                    {data.paymentMethodLast4 ? `Visa •••• ${data.paymentMethodLast4}` : 'No card added'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {data.paymentMethodLast4
                      ? 'Default payment method'
                      : 'Add a card to fund campaigns'}
                  </p>
                </div>
              </div>
              <Divider />
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Total funded</span>
                <span className="font-mono text-sm text-text">{formatMoney(data.totalFunded)}</span>
              </div>
            </Card>

            <Button variant="secondary" onClick={() => router.push('/brand/add-payment-method')}>
              {data.paymentMethodLast4 ? 'Replace card' : 'Add a card'}
            </Button>

            <p className="flex items-start gap-2 px-1 text-xs text-text-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-text-tertiary" aria-hidden />
              Card details are stored and processed by Stripe. Zeyoo never touches your full card
              number.
            </p>
          </>
        )}
      </AsyncContent>
    </DetailShell>
  );
}
