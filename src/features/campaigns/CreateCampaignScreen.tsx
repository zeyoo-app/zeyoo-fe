'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { Button, Card, Field, PageHeader, Switch, Textarea, cn } from '@/design-system';
import type { CreateCampaignInput, Money, SocialPlatform } from '@/shared/api';
import { platformLabel } from '@/shared/format/platform';

import { useCreateCampaign } from './hooks';

// Brands brief on the three platforms campaigns can run on today; Snapchat is
// connectable for creators but not yet a campaign target.
const PLATFORMS: { value: SocialPlatform; label: string }[] = (['instagram', 'tiktok', 'youtube'] as const).map(
  (value) => ({ value, label: platformLabel(value) }),
);

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
  const [contentRules, setContentRules] = useState<string[]>([]);
  const [ruleDraft, setRuleDraft] = useState('');
  const [disclosure, setDisclosure] = useState(true);

  const addRule = () => {
    const rule = ruleDraft.trim();
    if (!rule || contentRules.includes(rule)) {
      setRuleDraft('');
      return;
    }
    setContentRules([...contentRules, rule]);
    setRuleDraft('');
  };

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
        contentRules,
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

        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium text-text-muted">Content rules</p>
          <div className="flex gap-2">
            <Field
              placeholder="Show the product in the first 3 seconds"
              value={ruleDraft}
              onChange={(event) => setRuleDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addRule();
                }
              }}
            />
            <Button variant="secondary" fullWidth={false} onClick={addRule}>
              Add
            </Button>
          </div>
          {contentRules.length ? (
            <ul className="mt-1 flex flex-col gap-1.5">
              {contentRules.map((rule) => (
                <li
                  key={rule}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-text"
                >
                  <span>{rule}</span>
                  <button
                    type="button"
                    aria-label={`Remove rule: ${rule}`}
                    onClick={() => setContentRules(contentRules.filter((entry) => entry !== rule))}
                    className="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
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
