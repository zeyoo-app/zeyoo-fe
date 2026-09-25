'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Card, Field, PageHeader, Switch, Textarea, cn } from '@/design-system';
import type { CreateCampaignInput, Money, SocialPlatform } from '@/shared/api';

import { useCreateCampaign } from './hooks';

const PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
];

const USD = 'USD';
const MINOR_UNITS_PER_MAJOR = 100;

function dollarsToMoney(dollars: string): Money {
  const parsed = Number.parseFloat(dollars);
  const amount = Number.isFinite(parsed) ? parsed : 0;
  return { minorUnits: Math.round(amount * MINOR_UNITS_PER_MAJOR), currency: USD };
}

function parseList(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function CreateCampaignScreen() {
  const router = useRouter();
  const createCampaign = useCreateCampaign();

  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [brief, setBrief] = useState('');
  const [rate, setRate] = useState('3.00');
  const [budget, setBudget] = useState('625.00');
  const [cap, setCap] = useState('50.00');
  const [hashtags, setHashtags] = useState('');
  const [mentions, setMentions] = useState('');
  const [disclosure, setDisclosure] = useState(true);

  const canPublish = title.trim().length > 2 && brief.trim().length > 10 && !createCampaign.isPending;

  const submit = () => {
    const input: CreateCampaignInput = {
      title: title.trim(),
      platform,
      brief: brief.trim(),
      ratePerThousandViews: dollarsToMoney(rate),
      budget: dollarsToMoney(budget),
      perCreatorCap: dollarsToMoney(cap),
      requirements: {
        hashtags: parseList(hashtags),
        mentions: parseList(mentions),
        disclosureRequired: disclosure,
      },
    };
    createCampaign.mutate(input, {
      onSuccess: (campaign) => router.replace(`/brand/campaigns/${campaign.id}`),
    });
  };

  return (
    <>
      <PageHeader title="New campaign" subtitle="Set the brief, budget, and reward rate." />

      <div className="flex max-w-2xl flex-col gap-4">
        <Field label="Campaign title" placeholder="Summer Skincare Launch" value={title} onChange={(event) => setTitle(event.target.value)} />

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-text-muted">Platform</p>
          <div className="flex gap-2">
            {PLATFORMS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPlatform(option.value)}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-medium',
                  platform === option.value ? 'border-primary bg-primary/10 text-green-text' : 'border-border text-text-muted',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Textarea label="Brief" placeholder="What should creators make?" value={brief} onChange={(event) => setBrief(event.target.value)} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Rate / 1K views ($)" inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} />
          <Field label="Total budget ($)" inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} />
          <Field label="Max / creator ($)" inputMode="decimal" value={cap} onChange={(event) => setCap(event.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hashtags" placeholder="#GlowWithNimbus" value={hashtags} onChange={(event) => setHashtags(event.target.value)} />
          <Field label="Mentions" placeholder="@glowbeauty" value={mentions} onChange={(event) => setMentions(event.target.value)} />
        </div>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Require ad disclosure</p>
            <p className="text-xs text-text-muted">Creators must disclose the paid partnership.</p>
          </div>
          <Switch checked={disclosure} onChange={setDisclosure} label="Require ad disclosure" />
        </Card>

        <Button loading={createCampaign.isPending} disabled={!canPublish} onClick={submit}>
          Publish campaign
        </Button>
      </div>
    </>
  );
}
