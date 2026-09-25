'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AsyncContent, Badge, Button, Card, Field, SegmentedToggle } from '@/design-system';
import type { Campaign, SubmissionKind } from '@/shared/api';
import { formatMoney, formatRatePerThousandViews } from '@/shared/money/money';

import { CampaignCover } from './CampaignCover';
import { useCampaign } from './hooks';
import { useSubmitParticipation } from '../submissions/hooks';

const KIND_OPTIONS: { value: SubmissionKind; label: string }[] = [
  { value: 'link', label: 'Paste link' },
  { value: 'upload', label: 'Upload' },
];

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
  const submit = useSubmitParticipation();
  const [kind, setKind] = useState<SubmissionKind>('link');
  const [postUrl, setPostUrl] = useState('');

  const canSubmit = postUrl.trim().length > 4 && !submit.isPending;

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

      <Card className="mt-8">
        <h2 className="font-display text-lg font-semibold text-text">Submit your content</h2>
        <div className="mt-3 max-w-xs">
          <SegmentedToggle options={KIND_OPTIONS} value={kind} onChange={setKind} ariaLabel="Submission type" />
        </div>
        <div className="mt-3">
          <Field
            placeholder={kind === 'link' ? 'https://instagram.com/p/…' : 'Uploaded file URL'}
            value={postUrl}
            onChange={(event) => setPostUrl(event.target.value)}
            aria-label="Post URL"
          />
        </div>
        <div className="mt-3">
          <Button
            loading={submit.isPending}
            disabled={!canSubmit}
            onClick={() =>
              submit.mutate(
                { campaignId: campaign.id, postUrl: postUrl.trim(), kind },
                { onSuccess: () => router.replace('/creator/submissions') },
              )
            }
          >
            Submit for review
          </Button>
        </div>
      </Card>
    </>
  );
}
