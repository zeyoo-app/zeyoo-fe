'use client';

import { AsyncContent, PageHeader, StatCard } from '@/design-system';

import { CampaignCard } from './CampaignCard';
import { useBrandDashboard } from './hooks';

export function BrandDashboardScreen() {
  const query = useBrandDashboard();

  return (
    <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
      {(dashboard) => (
        <>
          <PageHeader eyebrow="Dashboard" title={`Welcome back, ${dashboard.greetingName}`} />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {dashboard.stats.map((stat) => (
              <StatCard key={stat.label} value={stat.value} label={stat.label} caption={stat.caption} />
            ))}
          </div>

          <section className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold text-text">Active campaigns</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {dashboard.activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} href={`/brand/campaigns/${campaign.id}`} />
              ))}
            </div>
          </section>
        </>
      )}
    </AsyncContent>
  );
}
