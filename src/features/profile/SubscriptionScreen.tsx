'use client';

import { useState } from 'react';

import { AsyncContent, Button, Card, ChoiceChips, Divider, type Choice } from '@/design-system';
import type { BillingPlan } from '@/shared/api';
import { formatMoney } from '@/shared/money/money';
import { DetailShell } from '@/shared/shell';

import { useBrandBilling, useSetBillingPlan } from '../earnings/hooks';

const FALLBACK_PLAN: BillingPlan = 'Starter';

const PLANS: Choice<BillingPlan>[] = [
  { value: 'Starter', label: 'Starter' },
  { value: 'Growth', label: 'Growth' },
  { value: 'Scale', label: 'Scale' },
];

/** Brand subscription: current tier, monthly spend, and plan changes. */
export function SubscriptionScreen() {
  const billing = useBrandBilling();
  const setPlan = useSetBillingPlan();
  const [selected, setSelected] = useState<BillingPlan | null>(null);

  const current = billing.data?.plan;
  const plan = selected ?? current ?? FALLBACK_PLAN;
  const changed = selected !== null && selected !== current;

  return (
    <DetailShell
      role="brand"
      title="Subscription"
      subtitle="Choose the tier that matches your campaign volume."
    >
      <AsyncContent
        isLoading={billing.isLoading}
        isError={billing.isError}
        data={billing.data}
      >
        {(data) => (
          <>
            <Card className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Current plan
              </p>
              <p className="font-display text-2xl font-semibold text-text">{data.plan}</p>
              <Divider />
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Spend this month</span>
                <span className="font-mono text-sm text-text">{formatMoney(data.monthlySpend)}</span>
              </div>
            </Card>

            <div>
              <h2 className="mb-3 font-display text-lg font-semibold text-text">Change plan</h2>
              <Card className="flex flex-col gap-3">
                <ChoiceChips
                  accessibilityLabel="Billing plan"
                  choices={PLANS}
                  value={plan}
                  onChange={setSelected}
                />
                <p className="text-xs text-text-muted">
                  Higher tiers unlock more active campaigns and priority review.
                </p>
              </Card>
            </div>

            {setPlan.error ? (
              <p className="text-xs text-danger">
                {setPlan.error instanceof Error
                  ? setPlan.error.message
                  : 'Could not update your plan.'}
              </p>
            ) : null}

            <Button
              loading={setPlan.isPending}
              disabled={!changed}
              onClick={async () => {
                // Opens Stripe Checkout; the plan updates once payment completes.
                await setPlan.mutateAsync(plan);
              }}
            >
              Update plan
            </Button>
          </>
        )}
      </AsyncContent>
    </DetailShell>
  );
}
