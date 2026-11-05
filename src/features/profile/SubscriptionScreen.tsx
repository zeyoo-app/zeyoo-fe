'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

import { AsyncContent, Badge, Button, Card, Divider, cn, useConfirm } from '@/design-system';
import type { BillingPlan, BillingPlanDetails } from '@/shared/api';
import { useI18n } from '@/shared/i18n';
import { formatMoney } from '@/shared/money/money';
import { DetailShell } from '@/shared/shell';

import {
  useBillingPlans,
  useBrandBilling,
  useCancelBillingPlan,
  useResumeBillingPlan,
  useSetBillingPlan,
} from '../earnings/hooks';

/** Brand subscription: current tier, monthly spend, and what each tier includes. */
export function SubscriptionScreen() {
  const confirm = useConfirm();
  const billing = useBrandBilling();
  const plans = useBillingPlans();
  const setPlan = useSetBillingPlan();
  const cancelPlan = useCancelBillingPlan();
  const resumePlan = useResumeBillingPlan();
  const [selected, setSelected] = useState<BillingPlan | null>(null);

  const current = billing.data?.plan;
  const paying = current !== undefined && current !== 'Starter';
  const endsAt = billing.data?.planEndsAt;
  const choice = plans.data?.find((plan) => plan.plan === (selected ?? current));
  const changed = selected !== null && selected !== current;
  // Moving down to the free tier means cancelling the paid subscription, not buying one.
  const toStarter = changed && choice?.purchasable === false;
  const error = setPlan.error ?? cancelPlan.error ?? resumePlan.error;

  async function cancel() {
    const confirmed = await confirm({
      title: 'Cancel your subscription?',
      message:
        "You keep your current plan until the end of the period you've paid for, then move to Starter. Live campaigns stay live.",
      confirmLabel: 'Cancel subscription',
      tone: 'danger',
    });
    if (confirmed) cancelPlan.mutate(undefined, { onSuccess: () => setSelected(null) });
  }

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
              {endsAt ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-text-muted">
                    Ends on {new Date(endsAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}. You&apos;ll move to Starter after that.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    loading={resumePlan.isPending}
                    onClick={() => resumePlan.mutate()}
                  >
                    Keep my plan
                  </Button>
                </div>
              ) : null}
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

            {error ? (
              <p className="text-xs text-danger">
                {error instanceof Error ? error.message : 'Could not update your plan.'}
              </p>
            ) : null}

            {toStarter && paying ? (
              endsAt ? (
                <p className="text-xs text-text-muted">Your plan is already set to end. Keep it from the card above.</p>
              ) : (
                <Button variant="secondary" loading={cancelPlan.isPending} onClick={() => void cancel()}>
                  Cancel subscription
                </Button>
              )
            ) : (
              <>
                {paying && changed && choice ? (
                  <p className="text-xs text-text-muted">
                    Your plan changes now. Stripe adjusts your next bill for the rest of this period.
                  </p>
                ) : null}
                <Button
                  loading={setPlan.isPending}
                  disabled={!changed || !choice?.purchasable}
                  onClick={() => {
                    // From Starter this opens Stripe Checkout; a paying brand switches in place.
                    if (choice) setPlan.mutate(choice.plan, { onSuccess: () => setSelected(null) });
                  }}
                >
                  {choice && changed ? `${paying ? 'Switch' : 'Upgrade'} to ${choice.plan}` : 'Update plan'}
                </Button>
              </>
            )}
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
