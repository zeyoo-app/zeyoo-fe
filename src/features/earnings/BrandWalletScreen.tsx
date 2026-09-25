'use client';

import { CreditCard } from 'lucide-react';

import { AsyncContent, Card, PageHeader, SegmentedToggle, StatCard } from '@/design-system';
import type { BillingPlan } from '@/shared/api';
import { formatMoney } from '@/shared/money/money';

import { useBrandBilling, useSetBillingPlan } from './hooks';

const PLAN_OPTIONS: { value: BillingPlan; label: string }[] = [
  { value: 'Starter', label: 'Starter' },
  { value: 'Growth', label: 'Growth' },
  { value: 'Scale', label: 'Scale' },
];

export function BrandWalletScreen() {
  const billingQuery = useBrandBilling();
  const setPlan = useSetBillingPlan();

  return (
    <>
      <PageHeader title="Wallet & billing" subtitle="Your spend and subscription." />
      <AsyncContent isLoading={billingQuery.isLoading} isError={billingQuery.isError} data={billingQuery.data}>
        {(billing) => (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard value={formatMoney(billing.monthlySpend)} label="Spend this month" />
              <StatCard value={formatMoney(billing.totalFunded)} label="Total funded" />
            </div>

            <Card className="mt-4">
              <p className="text-sm font-medium text-text">Subscription</p>
              <p className="mb-3 text-xs text-text-muted">You are on the {billing.plan} plan.</p>
              <div className="max-w-md">
                <SegmentedToggle
                  options={PLAN_OPTIONS}
                  value={billing.plan as BillingPlan}
                  onChange={(plan) => setPlan.mutate(plan)}
                  ariaLabel="Subscription plan"
                />
              </div>
            </Card>

            {billing.paymentMethodLast4 ? (
              <Card className="mt-4 flex items-center gap-3">
                <CreditCard className="size-5 text-text-muted" />
                <p className="font-numeric text-sm text-text">Visa •••• {billing.paymentMethodLast4}</p>
              </Card>
            ) : null}
          </>
        )}
      </AsyncContent>
    </>
  );
}
