'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { AsyncContent, EmptyState, PageHeader, SegmentedToggle } from '@/design-system';
import type { CampaignStatus } from '@/shared/api';

import { CampaignCard } from './CampaignCard';
import { useBrandCampaigns } from './hooks';

type Filter = 'all' | CampaignStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'draft', label: 'Draft' },
];

export function BrandCampaignsScreen() {
  const query = useBrandCampaigns();
  const [filter, setFilter] = useState<Filter>('all');

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Create, publish, and review your campaigns."
        action={
          <Link
            href="/brand/campaigns/new"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            <Plus className="size-4" /> New campaign
          </Link>
        }
      />

      <div className="mb-5 max-w-md">
        <SegmentedToggle options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Filter campaigns" />
      </div>

      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(campaigns) => {
          const visible = campaigns.filter((campaign) => filter === 'all' || campaign.status === filter);
          if (visible.length === 0) {
            return <EmptyState title="No campaigns here yet" description="Create a campaign to start working with creators." />;
          }
          return (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} href={`/brand/campaigns/${campaign.id}`} />
              ))}
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
}
