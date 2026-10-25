'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AsyncContent, Button, Card, Field, PageHeader, Textarea } from '@/design-system';
import type { Campaign } from '@/shared/api';
import { BackButton } from '@/shared/nav/BackButton';

import { useCampaign, useUpdateCampaign } from './hooks';

/** Splits "#a, #b c" into ["#a", "#b", "#c"], adding the prefix where it is missing. */
function parseTags(value: string, prefix: '#' | '@'): string[] {
  return value
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith(prefix) ? tag : `${prefix}${tag}`));
}

/**
 * Edits a campaign (contract §1.2). A live campaign keeps the money and reward terms
 * creators applied on, so only its wording, requirements and end date (later only) change.
 */
export function EditCampaignScreen({ campaignId }: { campaignId: string }) {
  const query = useCampaign(campaignId);
  return (
    <>
      <div className="mb-4">
        <BackButton />
      </div>
      <PageHeader title="Edit campaign" />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(campaign) => <EditForm campaign={campaign} />}
      </AsyncContent>
    </>
  );
}

function EditForm({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const update = useUpdateCampaign();
  const originalEnd = campaign.endDate ? campaign.endDate.slice(0, 10) : '';
  const [title, setTitle] = useState(campaign.title);
  const [brief, setBrief] = useState(campaign.brief);
  const [goals, setGoals] = useState(campaign.goals ?? '');
  const [audience, setAudience] = useState(campaign.audience ?? '');
  const [rules, setRules] = useState(campaign.requirements.contentRules.join('\n'));
  const [hashtags, setHashtags] = useState(campaign.requirements.hashtags.join(' '));
  const [mentions, setMentions] = useState(campaign.requirements.mentions.join(' '));
  const [endDate, setEndDate] = useState(originalEnd);

  const live = campaign.status === 'live';
  const endValid = !live || !originalEnd || !endDate || endDate >= originalEnd;
  const valid = title.trim().length >= 3 && brief.trim().length > 10 && endValid;

  if (campaign.status === 'closed') {
    return <Card className="text-sm text-text-muted">This campaign is closed and can no longer be edited.</Card>;
  }

  function save() {
    update.mutate(
      {
        campaignId: campaign.id,
        title,
        brief,
        goals,
        audience,
        contentRules: rules
          .split('\n')
          .map((rule) => rule.trim())
          .filter(Boolean),
        hashtags: parseTags(hashtags, '#'),
        mentions: parseTags(mentions, '@'),
        endDate: endDate && endDate !== originalEnd ? new Date(`${endDate}T23:59:59`).toISOString() : undefined,
      },
      { onSuccess: () => router.push(`/brand/campaigns/${campaign.id}`) },
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {live ? (
        <Card className="text-sm text-text-muted">
          This campaign is live. Its budget, reward and platforms stay as creators saw them; you can update the
          wording and requirements, and extend the end date.
        </Card>
      ) : null}
      <Field label="Campaign Title" maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} />
      <Textarea label="Campaign Brief" value={brief} onChange={(event) => setBrief(event.target.value)} />
      <Textarea label="Campaign Goals (Optional)" maxLength={2000} value={goals} onChange={(event) => setGoals(event.target.value)} />
      <Textarea label="Target Audience (Optional)" maxLength={2000} value={audience} onChange={(event) => setAudience(event.target.value)} />
      <Textarea label="Content Rules (one per line)" value={rules} onChange={(event) => setRules(event.target.value)} />
      <Field label="Required Hashtags" value={hashtags} onChange={(event) => setHashtags(event.target.value)} />
      <Field label="Required Mentions" value={mentions} onChange={(event) => setMentions(event.target.value)} />
      <Field
        label={live ? 'End Date (can only move later)' : 'End Date'}
        type="date"
        min={live ? originalEnd : undefined}
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
        error={endValid ? undefined : 'A live campaign can be extended, not shortened.'}
      />
      {update.error ? (
        <p className="text-xs text-danger">
          {update.error instanceof Error ? update.error.message : 'Could not save your changes.'}
        </p>
      ) : null}
      <div>
        <Button fullWidth={false} loading={update.isPending} disabled={!valid || update.isPending} onClick={save}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
