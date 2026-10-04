'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clapperboard, Clock, Scissors, X } from 'lucide-react';

import {
  Button,
  Card,
  ChoiceChips,
  Field,
  ImageUpload,
  Modal,
  PageHeader,
  ProgressBar,
  Textarea,
  cn,
  type PickedImage,
} from '@/design-system';
import type {
  Campaign,
  CampaignCategory,
  CampaignContentType,
  CreateCampaignInput,
  Money,
  ReferenceMaterial,
  SocialPlatform,
} from '@/shared/api';
import { platformLabel } from '@/shared/format/platform';
import { formatMoney, formatRatePerThousandViews } from '@/shared/money/money';

import {
  useCampaignCategories,
  useCreateCampaign,
  useFundCampaign,
  useSetCampaignStatus,
} from './hooks';

type WizardStep = 1 | 2 | 3 | 'review';

const PLATFORMS = (['instagram', 'tiktok', 'youtube'] as const).map((value) => ({
  value,
  label: platformLabel(value),
}));
const CAMPAIGN_TYPES: { value: CampaignContentType; label: string; description: string }[] = [
  { value: 'ugc', label: 'UGC', description: 'Creators produce original content featuring your brand.' },
  { value: 'clipping', label: 'Clipping', description: 'Creators turn your approved content into short videos.' },
];
const MINOR_UNITS_PER_MAJOR = 100;

export function CreateCampaignScreen() {
  const router = useRouter();
  const categories = useCampaignCategories();
  const createCampaign = useCreateCampaign();
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<Campaign | null>(null);
  const [live, setLive] = useState<Campaign | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignContentType>('ugc');
  const [categoryId, setCategoryId] = useState('');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [cover, setCover] = useState<PickedImage | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [reward, setReward] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [brief, setBrief] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagDraft, setHashtagDraft] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [mentionDraft, setMentionDraft] = useState('');
  const [contentRules, setContentRules] = useState<string[]>([]);
  const [ruleDraft, setRuleDraft] = useState('');
  const [references, setReferences] = useState('');

  const selectedCategory = categories.data?.find((category) => category.id === categoryId);
  const basicsValid = title.trim().length > 2 && Boolean(categoryId) && Boolean(endDate);
  const rewardsValid = dollarsToMoney(budget).minorUnits > 0 && dollarsToMoney(reward).minorUnits > 0;
  const requirementsValid = brief.trim().length > 10;

  function goBack() {
    if (step === 1) router.back();
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else setStep(3);
  }

  function addRule() {
    const rule = ruleDraft.trim();
    if (!rule || contentRules.includes(rule)) return;
    setContentRules((current) => [...current, rule]);
    setRuleDraft('');
  }

  async function createDraft() {
    const context = [
      brief.trim(),
      `Campaign type: ${campaignType === 'ugc' ? 'UGC' : 'Clipping'}.`,
      `Category: ${selectedCategory?.name ?? ''}.`,
    ].join('\n\n');
    const input: CreateCampaignInput = {
      title: title.trim(),
      platform,
      contentType: campaignType,
      categoryId,
      endDate: new Date(`${endDate}T23:59:59`).toISOString(),
      coverImageUrl: cover?.url,
      brief: context,
      ratePerThousandViews: dollarsToMoney(reward),
      budget: dollarsToMoney(budget),
      perCreatorCap: dollarsToMoney(budget),
      requirements: {
        // A tag still being typed counts: it is committed on submit as well as on a separator.
        hashtags: appendTags(hashtags, hashtagDraft, '#'),
        mentions: appendTags(mentions, mentionDraft, '@'),
        contentRules,
        disclosureRequired: true,
      },
      referenceMaterials: parseReferences(references),
    };
    try {
      setDraft(await createCampaign.mutateAsync(input));
    } catch {
      // The review step renders the mutation error and keeps the form editable.
    }
  }

  if (live) {
    return (
      <CampaignLive
        campaign={live}
        onView={() => router.replace(`/brand/campaigns/${live.id}`)}
        onDashboard={() => router.replace('/brand')}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <button type="button" onClick={goBack} className="mb-4 rounded-lg p-2 text-text-muted hover:bg-surface-hover" aria-label="Go back">
        <ArrowLeft className="size-5" />
      </button>

      {step === 'review' ? (
        <ReviewStep
          title={title}
          campaignType={campaignType}
          category={selectedCategory?.name ?? ''}
          endDate={endDate}
          platform={platform}
          budget={dollarsToMoney(budget)}
          reward={dollarsToMoney(reward)}
          brief={brief}
          hashtags={appendTags(hashtags, hashtagDraft, '#').join(' ')}
          mentions={appendTags(mentions, mentionDraft, '@').join(' ')}
          contentRules={contentRules}
          references={references}
          loading={createCampaign.isPending}
          error={createCampaign.error instanceof Error ? createCampaign.error.message : null}
          onEdit={setStep}
          onContinue={() => void createDraft()}
        />
      ) : (
        <>
          <StepProgress step={step} />
          {step === 1 ? (
            <BasicsStep
              campaignType={campaignType}
              categoryId={categoryId}
              categories={categories.data ?? []}
              categoriesLoading={categories.isPending}
              endDate={endDate}
              title={title}
              cover={cover}
              coverError={coverError}
              onCampaignTypeChange={setCampaignType}
              onCategoryChange={setCategoryId}
              onEndDateChange={setEndDate}
              onTitleChange={setTitle}
              onCoverChange={(image) => { setCoverError(null); setCover(image); }}
              onCoverError={setCoverError}
              onContinue={() => setStep(2)}
              valid={basicsValid}
            />
          ) : step === 2 ? (
            <RewardsStep
              budget={budget}
              reward={reward}
              platform={platform}
              onBudgetChange={setBudget}
              onRewardChange={setReward}
              onPlatformChange={setPlatform}
              onContinue={() => setStep(3)}
              valid={rewardsValid}
            />
          ) : (
            <RequirementsStep
              brief={brief}
              hashtags={hashtags}
              hashtagDraft={hashtagDraft}
              mentions={mentions}
              mentionDraft={mentionDraft}
              contentRules={contentRules}
              ruleDraft={ruleDraft}
              references={references}
              onBriefChange={setBrief}
              onHashtagsChange={setHashtags}
              onHashtagDraftChange={setHashtagDraft}
              onMentionsChange={setMentions}
              onMentionDraftChange={setMentionDraft}
              onRuleDraftChange={setRuleDraft}
              onRuleAdd={addRule}
              onRuleRemove={(rule) => setContentRules((current) => current.filter((entry) => entry !== rule))}
              onReferencesChange={setReferences}
              onContinue={() => setStep('review')}
              valid={requirementsValid}
            />
          )}
        </>
      )}

      <FundingDialog
        campaign={draft}
        onClose={() => setDraft(null)}
        onViewDraft={() => draft && router.replace(`/brand/campaigns/${draft.id}`)}
        onPublished={(campaign) => { setDraft(null); setLive(campaign); }}
      />
    </div>
  );
}

function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <p className="text-sm text-text-muted">Step {step} of 3</p>
      <ProgressBar value={step / 3} />
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <PageHeader title={title} subtitle={subtitle} />;
}

interface BasicsProps {
  campaignType: CampaignContentType;
  categoryId: string;
  categories: CampaignCategory[];
  categoriesLoading: boolean;
  endDate: string;
  title: string;
  cover: PickedImage | null;
  coverError: string | null;
  onCampaignTypeChange: (value: CampaignContentType) => void;
  onCategoryChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onCoverChange: (value: PickedImage | null) => void;
  onCoverError: (message: string) => void;
  onContinue: () => void;
  valid: boolean;
}

function BasicsStep(props: BasicsProps) {
  return (
    <div className="flex flex-col gap-5">
      <StepHeading title="Campaign Basics" subtitle="Tell creators what this campaign is about." />
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-text-muted">Campaign Type</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {CAMPAIGN_TYPES.map((type) => {
            const Icon = type.value === 'ugc' ? Clapperboard : Scissors;
            return (
            <button
              type="button"
              key={type.value}
              onClick={() => props.onCampaignTypeChange(type.value)}
              className={cn('relative rounded-2xl border p-4 text-left', props.campaignType === type.value ? 'border-primary bg-primary/10' : 'border-border bg-surface')}
            >
              <span className="mb-2 flex size-8 items-center justify-center rounded-full bg-surface-raised"><Icon className="size-4" /></span>
              <p className="font-display text-lg font-semibold">{type.label}</p>
              <p className="mt-1 text-sm text-text-muted">{type.description}</p>
              {props.campaignType === type.value ? <Check className="absolute right-3 top-3 size-4 text-green-text" /> : null}
            </button>
            );
          })}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-text-muted">
        Campaign Category
        <select value={props.categoryId} onChange={(event) => props.onCategoryChange(event.target.value)} className="h-12 rounded-xl border border-border bg-surface-raised px-4 text-[15px] text-text">
          <option value="">{props.categoriesLoading ? 'Loading categories…' : 'Select category'}</option>
          {props.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <Field label="Campaign End Date" type="date" min={new Date().toISOString().slice(0, 10)} value={props.endDate} onChange={(event) => props.onEndDateChange(event.target.value)} />
      <Field label="Campaign Title" placeholder="e.g. Summer Skincare Launch" value={props.title} onChange={(event) => props.onTitleChange(event.target.value)} />
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-text-muted">Cover Image</p>
        <ImageUpload value={props.cover} onChange={props.onCoverChange} onError={props.onCoverError} label="Upload cover image" height={180} />
      </div>
      {props.coverError ? <p className="text-xs text-danger">{props.coverError}</p> : null}
      <Button disabled={!props.valid} onClick={props.onContinue}>Next Step</Button>
    </div>
  );
}

interface RewardsProps {
  budget: string;
  reward: string;
  platform: SocialPlatform;
  onBudgetChange: (value: string) => void;
  onRewardChange: (value: string) => void;
  onPlatformChange: (value: SocialPlatform) => void;
  onContinue: () => void;
  valid: boolean;
}

function RewardsStep(props: RewardsProps) {
  return (
    <div className="flex flex-col gap-5">
      <StepHeading title="Reward & Platforms" subtitle="Set your budget and where creators should post." />
      <Field label="Total Reward Budget" inputMode="decimal" placeholder="0.00" value={props.budget} onChange={(event) => props.onBudgetChange(event.target.value)} />
      <Field label="Reward Per 1,000 Views" inputMode="decimal" placeholder="0.00" value={props.reward} onChange={(event) => props.onRewardChange(event.target.value)} />
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-text-muted">Platforms</p>
        <ChoiceChips choices={PLATFORMS} value={props.platform} onChange={props.onPlatformChange} accessibilityLabel="Platform" />
      </div>
      <Button disabled={!props.valid} onClick={props.onContinue}>Next Step</Button>
    </div>
  );
}

interface RequirementsProps {
  brief: string;
  hashtags: string[];
  hashtagDraft: string;
  mentions: string[];
  mentionDraft: string;
  contentRules: string[];
  ruleDraft: string;
  references: string;
  onBriefChange: (value: string) => void;
  onHashtagsChange: (value: string[]) => void;
  onHashtagDraftChange: (value: string) => void;
  onMentionsChange: (value: string[]) => void;
  onMentionDraftChange: (value: string) => void;
  onRuleDraftChange: (value: string) => void;
  onRuleAdd: () => void;
  onRuleRemove: (rule: string) => void;
  onReferencesChange: (value: string) => void;
  onContinue: () => void;
  valid: boolean;
}

function RequirementsStep(props: RequirementsProps) {
  return (
    <div className="flex flex-col gap-5">
      <StepHeading title="Content Requirements" subtitle="Give creators a clear brief and posting guidelines." />
      <Textarea label="Campaign Brief" placeholder="Describe what creators should make…" value={props.brief} onChange={(event) => props.onBriefChange(event.target.value)} />
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-text-muted">Content Rules</p>
        <div className="flex gap-2">
          <Field className="flex-1" placeholder="Show the product in the first 3 seconds" value={props.ruleDraft} onChange={(event) => props.onRuleDraftChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); props.onRuleAdd(); } }} />
          <Button fullWidth={false} variant="secondary" onClick={props.onRuleAdd}>Add</Button>
        </div>
        {props.contentRules.map((rule) => (
          <div key={rule} className="flex items-center justify-between rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm">
            <span>{rule}</span>
            <button type="button" aria-label={`Remove rule: ${rule}`} onClick={() => props.onRuleRemove(rule)}><X className="size-4 text-text-muted" /></button>
          </div>
        ))}
      </div>
      <TagsField label="Required Hashtags" prefix="#" placeholder="#GlowWithNimbus" tags={props.hashtags} draft={props.hashtagDraft} onTagsChange={props.onHashtagsChange} onDraftChange={props.onHashtagDraftChange} />
      <TagsField label="Required Mentions" prefix="@" placeholder="@glowbeauty" tags={props.mentions} draft={props.mentionDraft} onTagsChange={props.onMentionsChange} onDraftChange={props.onMentionDraftChange} />
      <Textarea label="Reference Materials (Optional)" placeholder={'https://…/product-shots.zip\nhttps://…/demo-video.mp4'} value={props.references} onChange={(event) => props.onReferencesChange(event.target.value)} />
      <p className="-mt-3 text-xs text-text-muted">Paste links to videos, images, or files creators should use — one per line.</p>
      <Button disabled={!props.valid} onClick={props.onContinue}>Review Campaign</Button>
    </div>
  );
}

interface TagsFieldProps {
  label: string;
  prefix: '#' | '@';
  placeholder: string;
  tags: string[];
  draft: string;
  onTagsChange: (tags: string[]) => void;
  onDraftChange: (draft: string) => void;
}

/**
 * Hashtags and mentions as separate chips. A space, comma or Enter finishes the tag being
 * typed, the `#`/`@` is added automatically, and each chip can be removed.
 */
function TagsField({ label, prefix, placeholder, tags, draft, onTagsChange, onDraftChange }: TagsFieldProps) {
  const commitDraft = () => {
    onTagsChange(appendTags(tags, draft, prefix));
    onDraftChange('');
  };

  const handleChange = (text: string) => {
    if (!/[\s,]/.test(text)) {
      onDraftChange(text);
      return;
    }
    // A separator was typed: whatever precedes it is finished, whatever follows is the next tag.
    const parts = text.split(/[\s,]+/);
    const trailing = /[\s,]$/.test(text) ? '' : (parts.pop() ?? '');
    onTagsChange(appendTags(tags, parts.join(' '), prefix));
    onDraftChange(trailing);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-medium text-text-muted">{label}</p>
      <div className="flex gap-2">
        <Field
          className="flex-1"
          placeholder={placeholder}
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commitDraft(); } }}
          aria-label={`New ${label.toLowerCase()}`}
        />
        <Button fullWidth={false} variant="secondary" onClick={commitDraft}>Add</Button>
      </div>
      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm">
              {tag}
              <button type="button" aria-label={`Remove ${tag}`} onClick={() => onTagsChange(tags.filter((entry) => entry !== tag))}>
                <X className="size-3.5 text-text-muted" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface ReviewProps {
  title: string;
  campaignType: CampaignContentType;
  category: string;
  endDate: string;
  platform: SocialPlatform;
  budget: Money;
  reward: Money;
  brief: string;
  hashtags: string;
  mentions: string;
  contentRules: string[];
  references: string;
  loading: boolean;
  error: string | null;
  onEdit: (step: 1 | 2 | 3) => void;
  onContinue: () => void;
}

function ReviewStep(props: ReviewProps) {
  return (
    <div className="flex flex-col gap-5">
      <StepHeading title="Review Campaign" subtitle="Make sure everything looks right before publishing." />
      <ReviewSection title="Campaign Basics" onEdit={() => props.onEdit(1)} rows={[
        ['Campaign Title', props.title],
        ['Campaign Type', props.campaignType === 'ugc' ? 'UGC' : 'Clipping'],
        ['Category', props.category],
        ['End Date', formatDateDMY(props.endDate)],
      ]} />
      <ReviewSection title="Reward & Platforms" onEdit={() => props.onEdit(2)} rows={[
        ['Total Budget', formatMoney(props.budget)],
        ['Reward', formatRatePerThousandViews(props.reward)],
        ['Platform', platformLabel(props.platform)],
      ]} />
      <ReviewSection title="Content Requirements" onEdit={() => props.onEdit(3)} rows={[
        ['Brief', props.brief],
        ['Content Rules', props.contentRules.join(' • ') || '—'],
        ['Hashtags', props.hashtags || '—'],
        ['Mentions', props.mentions || '—'],
        ['Reference Materials', props.references.trim() ? `${parseReferences(props.references).length} link(s)` : '—'],
      ]} />
      <Card className="bg-primary/10 text-sm">Your wallet will only be charged when you fund and launch this campaign.</Card>
      {props.error ? <p className="text-xs text-danger">{props.error}</p> : null}
      <Button loading={props.loading} onClick={props.onContinue}>Continue to Funding</Button>
    </div>
  );
}

function ReviewSection({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <button type="button" onClick={onEdit} className="text-sm font-medium text-green-text">Edit</button>
      </div>
      <dl className="flex flex-col gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6 border-b border-border pb-3 last:border-0 last:pb-0">
            <dt className="text-sm text-text-muted">{label}</dt>
            <dd className="max-w-[65%] text-right text-sm text-text">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

type FundingStep = 'confirm' | 'processing' | 'pending' | 'failed';

function FundingDialog({ campaign, onClose, onViewDraft, onPublished }: { campaign: Campaign | null; onClose: () => void; onViewDraft: () => void; onPublished: (campaign: Campaign) => void }) {
  const fund = useFundCampaign();
  const publish = useSetCampaignStatus(campaign?.id ?? '');
  const [state, setState] = useState<FundingStep>('confirm');
  const [message, setMessage] = useState('');

  async function fundAndPublish() {
    if (!campaign) return;
    setState('processing');
    setMessage('');
    try {
      const funding = await fund.mutateAsync({ campaignId: campaign.id, amount: campaign.budget });
      if (funding.status === 'failed') {
        setMessage('Your payment could not be completed. Please try another payment method.');
        setState('failed');
        return;
      }
      if (funding.status === 'pending') {
        setMessage('Stripe is still confirming your payment authorization. The campaign stays a draft until it clears — no creators can see or join it yet.');
        setState('pending');
        return;
      }
      onPublished(await publish.mutateAsync('live'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Campaign funding failed.');
      setState('failed');
    }
  }

  const busy = state === 'processing' || state === 'pending';
  const title = state === 'failed' ? 'Funding failed' : state === 'pending' ? 'Payment processing' : 'Fund Campaign';

  return (
    <Modal open={Boolean(campaign)} onClose={busy ? () => undefined : onClose} title={title}>
      {campaign ? (
        state === 'pending' ? <>
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10"><Clock className="size-7 text-green-text" /></div>
          <h2 className="text-center font-display text-xl font-semibold">Payment processing</h2>
          <p className="text-center text-sm text-text-muted">{message}</p>
          <Button onClick={onViewDraft}>View Draft</Button>
        </> : state === 'failed' ? <>
          <p className="text-sm text-danger">{message}</p>
          <Button onClick={() => { setMessage(''); setState('confirm'); }}>Try Again</Button>
          <Button variant="secondary" onClick={onViewDraft}>Keep as Draft</Button>
        </> : <>
          <p className="text-sm text-text-muted">Review your campaign funding before continuing.</p>
          <Card className="flex flex-col gap-3">
            <ReviewLine label="Campaign" value={campaign.title} />
            <ReviewLine label="Funding amount" value={formatMoney(campaign.budget)} />
            <ReviewLine label="Payment method" value="Default card" />
          </Card>
          <Button loading={state === 'processing' || publish.isPending} disabled={state === 'processing'} onClick={() => void fundAndPublish()}>Fund & Publish</Button>
        </>
      ) : null}
    </Modal>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 text-sm"><span className="text-text-muted">{label}</span><span>{value}</span></div>;
}

function CampaignLive({ campaign, onView, onDashboard }: { campaign: Campaign; onView: () => void; onDashboard: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary"><Check className="size-8 text-on-primary" /></div>
      <PageHeader title="Your campaign is live!" subtitle="Creators can now discover and submit content for it." />
      <h2 className="font-display text-xl font-semibold">{campaign.title}</h2>
      <Card className="flex w-full flex-col gap-3">
        <ReviewLine label="Reward per 1K Views" value={formatRatePerThousandViews(campaign.ratePerThousandViews)} />
        <ReviewLine label="Platform" value={platformLabel(campaign.platform)} />
        <ReviewLine label="Total Budget" value={formatMoney(campaign.budget)} />
      </Card>
      <Button onClick={onView}>View Campaign</Button>
      <Button variant="secondary" onClick={onDashboard}>Go to Dashboard</Button>
    </div>
  );
}

function dollarsToMoney(value: string): Money {
  const parsed = Number.parseFloat(value);
  return {
    minorUnits: Number.isFinite(parsed) ? Math.round(parsed * MINOR_UNITS_PER_MAJOR) : 0,
    currency: 'USD',
  };
}

function normalizeTag(raw: string, prefix: '#' | '@'): string | null {
  const body = raw.trim().replace(/^[#@]+/, '').replace(/[^\p{L}\p{N}_.]/gu, '');
  return body ? `${prefix}${body}` : null;
}

/** Adds every tag found in `raw` (split on spaces or commas) to `tags`, skipping duplicates. */
function appendTags(tags: string[], raw: string, prefix: '#' | '@'): string[] {
  const next = [...tags];
  for (const token of raw.split(/[\s,]+/)) {
    const tag = normalizeTag(token, prefix);
    if (tag && !next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) next.push(tag);
  }
  return next;
}

function parseReferences(value: string): ReferenceMaterial[] {
  return value.split('\n').map((url) => url.trim()).filter(Boolean).map((url, index) => ({
    id: `reference-${index}`,
    name: url.split(/[?#]/).at(0)?.split('/').filter(Boolean).pop() || `Reference ${index + 1}`,
    url,
  }));
}

function formatDateDMY(value: string): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
