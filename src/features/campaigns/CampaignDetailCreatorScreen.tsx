'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { AsyncContent, Badge, Card } from '@/design-system';
import type { Campaign } from '@/shared/api';
import { formatMoney, formatRatePerThousandViews } from '@/shared/money/money';

import { CampaignCover } from './CampaignCover';
import { useCampaign } from './hooks';
import { ParticipationSection } from './ParticipationSection';

export function CampaignDetailCreatorScreen({ campaignId }: { campaignId: string }) {
  const query = useCampaign(campaignId);
  return (
    <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
      {(campaign) => <CampaignDetail campaign={campaign} />}
    </AsyncContent>
  );
}

function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const router = useRouter();

  return (
    <>
      <CampaignCover platform={campaign.platform} className="mb-5 h-40 rounded-2xl" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">{campaign.title}</h1>
          <p className="mt-0.5 text-text-muted">{campaign.brandName}</p>
        </div>
        <Badge tone="success" className="font-numeric">
          {formatRatePerThousandViews(campaign.ratePerThousandViews)}
        </Badge>
      </div>

      <Card className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Max you can earn</span>
          <span className="font-numeric text-text">{formatMoney(campaign.perCreatorCap)}</span>
        </div>
      </Card>

      <p className="mt-5 text-sm leading-relaxed text-text-muted">{campaign.brief}</p>

      {campaign.requirements.hashtags.length || campaign.requirements.mentions.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {campaign.requirements.hashtags.map((tag) => (
            <Badge key={tag} tone="accent">{tag}</Badge>
          ))}
          {campaign.requirements.mentions.map((mention) => (
            <Badge key={mention} tone="neutral">{mention}</Badge>
          ))}
          {campaign.requirements.disclosureRequired ? <Badge tone="warning">Ad disclosure required</Badge> : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => router.push(`/creator/campaigns/${campaign.id}/submissions`)}
        className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-start transition-colors hover:bg-surface-hover"
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-text">See Community Submissions</h2>
          <p className="text-sm text-text-muted">Get inspired by other creators&apos; videos</p>
        </div>
        <ChevronRight className="size-[22px] shrink-0 text-text-muted" aria-hidden />
      </button>

      <ParticipationSection campaign={campaign} />
    </>
  );
}
