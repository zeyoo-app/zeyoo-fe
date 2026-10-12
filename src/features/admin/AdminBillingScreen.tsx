'use client';

import { AsyncContent, Badge, Card, EmptyState, StatCard, type BadgeTone } from '@/design-system';
import type { AdminBilling } from '@/shared/api';

import { AdminPageHeader, DataTable, type Column } from './DataTable';
import { formatDate, formatMinor } from './format';
import { useAdminBilling } from './hooks';

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  PAST_DUE: { label: 'Payment overdue', tone: 'danger' },
  CANCELED: { label: 'Canceled', tone: 'neutral' },
  INCOMPLETE: { label: 'Checkout not finished', tone: 'warning' },
};

const PLAN_COLUMNS: Column<AdminBilling['plans'][number]>[] = [
  { header: 'Plan', cell: (plan) => <span className="font-medium">{plan.name}</span> },
  { header: 'Price / month', cell: (plan) => formatMinor(plan.priceMinor, plan.currencyCode) },
  { header: 'Active subscribers', cell: (plan) => plan.subscribers },
  {
    header: 'Stripe',
    cell: (plan) => (
      <Badge tone={plan.connectedToStripe ? 'success' : 'warning'}>
        {plan.connectedToStripe ? 'Price connected' : 'No Stripe price: checkout will fail'}
      </Badge>
    ),
  },
];

const SUBSCRIPTION_COLUMNS: Column<AdminBilling['subscriptions'][number]>[] = [
  { header: 'Organization', cell: (row) => <span className="font-medium">{row.organizationName}</span> },
  { header: 'Plan', cell: (row) => row.planName },
  {
    header: 'Status',
    cell: (row) => {
      const view = STATUS[row.status] ?? { label: row.status.toLowerCase(), tone: 'neutral' as const };
      return <Badge tone={view.tone}>{view.label}</Badge>;
    },
  },
  { header: 'Since', cell: (row) => formatDate(row.since) },
];

export function AdminBillingScreen() {
  const query = useAdminBilling();
  return (
    <>
      <AdminPageHeader
        title="Billing"
        subtitle="Brand subscriptions and plans. Changes to prices are made in Stripe; this page shows how they are wired up."
      />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(billing) => (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Active subscriptions" value={String(billing.summary.active)} />
              <StatCard label="Payment overdue" value={String(billing.summary.pastDue)} />
              <StatCard label="Canceled" value={String(billing.summary.canceled)} />
              <StatCard
                label="Brands with a saved card"
                value={String(billing.summary.organizationsWithCard)}
              />
            </div>

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-text">Plans</h2>
              {billing.plans.length === 0 ? (
                <Card className="p-4 text-sm text-text-muted">
                  No plans are set up yet, so brands cannot subscribe. Create the prices in Stripe, set the
                  plan price variables on the server, and run the plan seed.
                </Card>
              ) : (
                <DataTable
                  columns={PLAN_COLUMNS}
                  rows={billing.plans}
                  rowKey={(plan) => plan.key}
                  emptyTitle="No plans"
                />
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-text">Subscriptions</h2>
              {billing.subscriptions.length === 0 ? (
                <EmptyState
                  title="No subscriptions yet"
                  description="Brands that start a plan appear here."
                />
              ) : (
                <DataTable
                  columns={SUBSCRIPTION_COLUMNS}
                  rows={billing.subscriptions}
                  rowKey={(row) => row.id}
                  emptyTitle="No subscriptions"
                />
              )}
            </section>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
