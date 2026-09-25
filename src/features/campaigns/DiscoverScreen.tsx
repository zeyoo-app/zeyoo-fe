'use client';

import { useState } from 'react';

import { AsyncContent, EmptyState, Field, PageHeader } from '@/design-system';

import { CampaignCard } from './CampaignCard';
import { useDiscoverCampaigns } from './hooks';

export function DiscoverScreen() {
  const query = useDiscoverCampaigns();
  const [search, setSearch] = useState('');

  return (
    <>
      <PageHeader eyebrow="For you" title="Discover" subtitle="Fresh campaigns picked for you." />

      <div className="mb-5 max-w-md">
        <Field
          placeholder="Search campaigns"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search campaigns"
        />
      </div>

      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(campaigns) => {
          const term = search.trim().toLowerCase();
          const visible = campaigns.filter(
            (campaign) =>
              !term ||
              campaign.title.toLowerCase().includes(term) ||
              campaign.brandName.toLowerCase().includes(term),
          );
          if (visible.length === 0) {
            return <EmptyState title="No campaigns match" description="Try a different search." />;
          }
          return (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} href={`/creator/campaigns/${campaign.id}`} />
              ))}
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
}
