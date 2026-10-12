'use client';

import Link from 'next/link';

import { AsyncContent, Card, StatCard } from '@/design-system';

import { AdminPageHeader } from './DataTable';
import { formatTotals } from './format';
import { useAdminOverview } from './hooks';

export function AdminOverviewScreen() {
  const query = useAdminOverview();

  return (
    <>
      <AdminPageHeader title="Overview" subtitle="What needs attention and how the platform is doing." />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(overview) => {
          const { queues } = overview;
          const attention = [
            {
              href: '/admin/withdrawals',
              label: 'Withdrawals to approve',
              count: queues.withdrawalsRequested,
              note:
                queues.withdrawalsHeld > 0
                  ? `${queues.withdrawalsHeld} more on hold`
                  : 'Creators waiting to be paid',
            },
            {
              href: '/admin/disputes',
              label: 'Disputes to decide',
              count: queues.disputesActive,
              note: 'Appeals and complaints',
            },
            {
              href: '/admin/fraud',
              label: 'Earnings reviews open',
              count: queues.fraudCasesOpen,
              note: 'Creators with paused earnings',
            },
            {
              href: '/admin/verifications',
              label: 'Verifications to review',
              count: queues.verificationsPending,
              note: 'Creators asking for a badge',
            },
          ];
          return (
            <div className="flex flex-col gap-8">
              <section>
                <h2 className="mb-3 font-display text-lg font-semibold text-text">Needs attention</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {attention.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Card className="h-full p-4 transition-colors hover:bg-surface-hover">
                        <p className="font-numeric text-3xl text-text">{item.count}</p>
                        <p className="mt-1 text-sm font-medium text-text">{item.label}</p>
                        <p className="text-xs text-text-muted">{item.note}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-display text-lg font-semibold text-text">Money</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label="Funded by brands" value={formatTotals(overview.money.funded)} />
                  <StatCard label="Earned by creators" value={formatTotals(overview.money.creatorEarnings)} />
                  <StatCard label="Paid out to creators" value={formatTotals(overview.money.paidOut)} />
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-display text-lg font-semibold text-text">Platform</h2>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard
                    label="Creators"
                    value={String(overview.users.creators)}
                    caption={`${overview.users.joinedLast7Days} new accounts this week`}
                  />
                  <StatCard
                    label="Brand users"
                    value={String(overview.users.brands)}
                    caption={`${overview.organizations} organizations`}
                  />
                  <StatCard
                    label="Live campaigns"
                    value={String(overview.campaigns.published)}
                    caption={`${overview.campaigns.draft} drafts · ${overview.campaigns.closed} closed`}
                  />
                  <StatCard label="Suspended accounts" value={String(overview.users.suspended)} />
                </div>
              </section>
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
}
