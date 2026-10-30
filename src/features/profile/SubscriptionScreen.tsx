'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

import { AsyncContent, Badge, Button, Card, Divider, cn } from '@/design-system';
import type { BillingPlan, BillingPlanDetails } from '@/shared/api';
import { useI18n } from '@/shared/i18n';
import { formatMoney } from '@/shared/money/money';
import { DetailShell } from '@/shared/shell';

import { useBillingPlans, useBrandBilling, useSetBillingPlan } from '../earnings/hooks';

/** Brand subscription: current tier, monthly spend, and what each tier includes. */
export function SubscriptionScreen() {
  const billing = useBrandBilling();
  const plans = useBillingPlans();
  const setPlan = useSetBillingPlan();
  const [selected, setSelected] = useState<BillingPlan | null>(null);

  const current = billing.data?.plan;
  const choice = plans.data?.find((plan) => plan.plan === (selected ?? current));
  const changed = selected !== null && selected !== current;
  // Moving down to the free tier means cancelling the paid subscription, not buying one.
  const downgrade = changed && choice?.purchasable === false;

  return (
    <DetailShell
      role="brand"
      title="Subscription"
      subtitle="Choose the tier that matches your campaign volume."
    >
      <AsyncContent
        isLoading={billing.isLoading || plans.isLoading}
        isError={billing.isError || plans.isError}
        data={billing.data && plans.data ? { billing: billing.data, plans: plans.data } : undefined}
      >
        {(data) => (
          <>
            <Card className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Current plan
              </p>
              <p className="font-display text-2xl font-semibold text-text">{data.billing.plan}</p>
              <Divider />
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Spend this month</span>
                <span className="font-mono text-sm text-text">
                  {formatMoney(data.billing.monthlySpend)}
                </span>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-semibold text-text">Plans</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {data.plans.map((plan) => (
                  <PlanCard
                    key={plan.plan}
                    plan={plan}
                    current={plan.plan === current}
                    selected={plan.plan === (selected ?? current)}
                    onSelect={() => setSelected(plan.plan)}
                  />
                ))}
              </div>
            </div>

            {downgrade ? (
              <p className="text-xs text-text-muted">
                To move to Starter, ask us to cancel your subscription from Help & Support.
              </p>
            ) : null}
            {setPlan.error ? (
              <p className="text-xs text-danger">
                {setPlan.error instanceof Error
                  ? setPlan.error.message
                  : 'Could not update your plan.'}
              </p>
            ) : null}

            <Button
              loading={setPlan.isPending}
              disabled={!changed || downgrade || !choice?.purchasable}
              onClick={async () => {
                // Opens Stripe Checkout; the plan updates once payment completes.
                if (choice) await setPlan.mutateAsync(choice.plan);
              }}
            >
              {choice && changed && !downgrade ? `Upgrade to ${choice.plan}` : 'Update plan'}
            </Button>
          </>
        )}
      </AsyncContent>
    </DetailShell>
  );
}

interface PlanCardProps {
  plan: BillingPlanDetails;
  current: boolean;
  selected: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, current, selected, onSelect }: PlanCardProps) {
  const { locale } = useI18n();
  // Prices show in Saudi Riyals in Arabic and US Dollars otherwise; Stripe Checkout
  // charges in the payer's local currency of the two.
  const price = locale === 'ar' ? plan.priceSar : plan.priceUsd;
  const features = [
    plan.maxActiveCampaigns === null
      ? 'Unlimited live campaigns'
      : `${plan.maxActiveCampaigns} live campaign${plan.maxActiveCampaigns === 1 ? '' : 's'} at a time`,
    `${plan.platformFeePercent}% platform fee on campaign budgets`,
    plan.allowsPrivateCampaigns ? 'Invite-only campaigns' : 'Public campaigns only',
  ];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex flex-col gap-3 rounded-2xl border bg-surface p-5 text-start transition-colors',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-text">{plan.plan}</span>
        {current ? <Badge tone="success">Current</Badge> : null}
      </div>
      <p className="font-mono text-2xl text-text">
        {price.minorUnits === 0 ? 'Free' : formatMoney(price, locale)}
        {price.minorUnits === 0 ? null : (
          <span className="font-sans text-sm text-text-muted"> / month</span>
        )}
      </p>
      <ul className="flex flex-col gap-1.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-text">
            <Check className="size-4 shrink-0 text-green-text" />
            {feature}
          </li>
        ))}
      </ul>
    </button>
  );
}
