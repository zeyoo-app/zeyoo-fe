'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clapperboard, Clock, Pencil, Scissors, Sparkles, X } from 'lucide-react';

import {
  Button,
  Card,
  MultiChoiceChips,
  Field,
  ImageUpload,
  Modal,
  PageHeader,
  ProgressBar,
  SegmentedToggle,
  Textarea,
  cn,
  type PickedImage,
  useConfirm,
} from '@/design-system';
import type {
  CampaignVisibility,
  Campaign,
  CampaignCategory,
  CampaignContentType,
  CreateCampaignInput,
  RewardType,
  Money,
  ReferenceMaterial,
  SocialPlatform,
} from '@/shared/api';
import { platformLabel, platformsLabel } from '@/shared/format/platform';
import type { AiBriefDraft } from '@/shared/api';
import { formatCampaignReward, formatMoney } from '@/shared/money/money';

import { AiBriefDialog } from './AiBriefDialog';
import { formatAudience, parseAudience } from './audience';
import { AudienceFields } from './AudienceFields';
import {
  BRIEF_MAX,
  BRIEF_MIN,
  firstInvalid,
  TITLE_MAX,
  validateBasics,
  validateRequirements,
  validateRewards,
  type BasicsField,
  type CampaignField,
  type FieldErrors,
  type RequirementsField,
  type RewardsField,
} from './campaignValidation';
import {
  useCampaignCategories,
  useCreateCampaign,
  useFundCampaign,
  useFundFromWallet,
  useSetCampaignStatus,
} from './hooks';
import { useBrandBilling } from '../earnings/hooks';

type WizardStep = 1 | 2 | 3 | 'review';

const PLATFORMS = (['instagram', 'tiktok', 'youtube', 'facebook', 'snapchat', 'x'] as const).map((value) => ({
  value,
  // X is still widely known as Twitter, so the picker names both.
  label: value === 'x' ? 'X (Twitter)' : platformLabel(value),
}));
const CAMPAIGN_TYPES: { value: CampaignContentType; label: string; description: string }[] = [
  { value: 'ugc', label: 'UGC', description: 'Creators produce original content featuring your brand.' },
  { value: 'clipping', label: 'Clipping', description: 'Creators turn your approved content into short videos.' },
];
const MINOR_UNITS_PER_MAJOR = 100;

const REWARD_TYPE_OPTIONS: { value: RewardType; label: string }[] = [
  { value: 'per_view', label: 'Per 1K views' },
  { value: 'per_item', label: 'Per approved post' },
];
const REWARD_TYPE_HINT: Record<RewardType, string> = {
  per_view: 'Creators earn for every 1,000 verified views, up to the per-creator maximum.',
  per_item: 'Creators earn a fixed amount for each post you approve.',
};

const VISIBILITY_OPTIONS: { value: CampaignVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Invite only' },
];
const VISIBILITY_HINT: Record<CampaignVisibility, string> = {
  public: 'Shown in Discover — any creator can find and join it.',
  private: 'Hidden from Discover — only creators you invite can see it.',
};

export function CreateCampaignScreen() {
  const router = useRouter();
  const categories = useCampaignCategories();
  const createCampaign = useCreateCampaign();
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<Campaign | null>(null);
  const [live, setLive] = useState<Campaign | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignContentType>('ugc');
  const [visibility, setVisibility] = useState<CampaignVisibility>('public');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rewardType, setRewardType] = useState<RewardType>('per_view');
  const [goals, setGoals] = useState('');
  const [audience, setAudience] = useState('');
  const [title, setTitle] = useState('');
  const [cover, setCover] = useState<PickedImage | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [reward, setReward] = useState('');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(['instagram']);
  const [maxPerCreator, setMaxPerCreator] = useState('');
  const [brief, setBrief] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagDraft, setHashtagDraft] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [mentionDraft, setMentionDraft] = useState('');
  const [contentRules, setContentRules] = useState<string[]>([]);
  const [ruleDraft, setRuleDraft] = useState('');
  const [references, setReferences] = useState('');
  const [aiBriefOpen, setAiBriefOpen] = useState(false);
  const confirm = useConfirm();

  const selectedCategory = categories.data?.find((category) => category.id === categoryId);
  // Each step's button stays enabled. Clicking it checks the step: problems show under
  // their fields and the first one is scrolled to and focused. Before that, a field shows
  // its problem only once the brand has left it (or picked a value).
  const [checkedSteps, setCheckedSteps] = useState<Record<1 | 2 | 3, boolean>>({ 1: false, 2: false, 3: false });
  const [touched, setTouched] = useState<Partial<Record<CampaignField, boolean>>>({});
  const touch = (field: CampaignField) => setTouched((current) => ({ ...current, [field]: true }));

  const basicsErrors = validateBasics({
    hasCategory: Boolean(categoryId),
    startDate: startDate ? localDay(startDate) : null,
    endDate: endDate ? localDay(endDate) : null,
    title,
  });
  const rewardsErrors = validateRewards({
    budget: dollarsToMoney(budget),
    reward: dollarsToMoney(reward),
    maxPerCreator: dollarsToMoney(maxPerCreator),
    platformCount: platforms.length,
    perItem: rewardType === 'per_item',
  });
  const requirementsErrors = validateRequirements({ brief, references });

  function shown<TField extends CampaignField>(step: 1 | 2 | 3, errors: FieldErrors<TField>): FieldErrors<TField> {
    if (checkedSteps[step]) return errors;
    return Object.fromEntries(
      Object.entries(errors).filter(([field]) => touched[field as CampaignField]),
    ) as FieldErrors<TField>;
  }

  /** Moves on when the step is complete; otherwise shows what is missing and goes to it. */
  function continueFrom<TField extends CampaignField>(step: 1 | 2 | 3, errors: FieldErrors<TField>, next: WizardStep) {
    const field = firstInvalid(errors);
    if (!field) {
      goToStep(next);
      return;
    }
    setCheckedSteps((current) => ({ ...current, [step]: true }));
    const element = document.getElementById(fieldId(field));
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element?.focus({ preventScroll: true });
  }

  function goToStep(next: WizardStep) {
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  function goBack() {
    if (step === 1) router.back();
    else if (step === 2) goToStep(1);
    else if (step === 3) goToStep(2);
    else goToStep(3);
  }

  /** Copies an AI draft into the requirements, asking first when it would replace text. */
  async function applyAiDraft(draft: AiBriefDraft) {
    const hasRequirements = Boolean(brief.trim() || goals.trim() || audience.trim() || contentRules.length || hashtags.length);
    if (
      hasRequirements &&
      !(await confirm({
        title: 'Replace your requirements?',
        message: 'The AI draft replaces the brief, goals, audience, content rules and hashtags you entered.',
        confirmLabel: 'Replace',
      }))
    ) {
      return;
    }
    setBrief(draft.brief);
    setGoals(draft.goals);
    // The audience is picked from lists, so only the part of the draft they can show is kept.
    setAudience(formatAudience(parseAudience(draft.audience)));
    setContentRules([...new Set(draft.contentRules.map((rule) => rule.trim()).filter(Boolean))]);
    setHashtags(appendTags([], draft.hashtags.join(' '), '#'));
    setHashtagDraft('');
  }

  function addRule() {
    const rule = ruleDraft.trim();
    if (!rule || contentRules.includes(rule)) return;
    setContentRules((current) => [...current, rule]);
    setRuleDraft('');
  }

  async function createDraft() {
    const input: CreateCampaignInput = {
      title: title.trim(),
      platforms,
      contentType: campaignType,
      visibility,
      categoryId,
      startDate: startDate ? new Date(`${startDate}T00:00:00`).toISOString() : undefined,
      endDate: new Date(`${endDate}T23:59:59`).toISOString(),
      coverImageUrl: cover?.url,
      brief: brief.trim(),
      goals,
      audience,
      rewardType,
      ratePerThousandViews: dollarsToMoney(reward),
      budget: dollarsToMoney(budget),
      perCreatorCap: dollarsToMoney(maxPerCreator).minorUnits > 0 ? dollarsToMoney(maxPerCreator) : dollarsToMoney(budget),
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
          visibility={visibility}
          category={selectedCategory?.name ?? ''}
          startDate={startDate}
          endDate={endDate}
          goals={goals}
          audience={audience}
          rewardType={rewardType}
          platforms={platforms}
          maxPerCreator={dollarsToMoney(maxPerCreator)}
          budget={dollarsToMoney(budget)}
          reward={dollarsToMoney(reward)}
          brief={brief}
          hashtags={appendTags(hashtags, hashtagDraft, '#').join(' ')}
          mentions={appendTags(mentions, mentionDraft, '@').join(' ')}
          contentRules={contentRules}
          references={references}
          loading={createCampaign.isPending}
          error={createCampaign.error instanceof Error ? createCampaign.error.message : null}
          onEdit={goToStep}
          onContinue={() => void createDraft()}
        />
      ) : (
        <>
          <StepProgress step={step} />
          {step === 1 ? (
            <BasicsStep
              campaignType={campaignType}
              visibility={visibility}
              categoryId={categoryId}
              categories={categories.data ?? []}
              categoriesLoading={categories.isPending}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              title={title}
              cover={cover}
              coverError={coverError}
              onCampaignTypeChange={setCampaignType}
              onVisibilityChange={setVisibility}
              onCategoryChange={(value) => { setCategoryId(value); touch('category'); }}
              onEndDateChange={(value) => { setEndDate(value); touch('endDate'); }}
              onTitleChange={setTitle}
              onTitleBlur={() => touch('title')}
              errors={shown(1, basicsErrors)}
              onCoverChange={(image) => { setCoverError(null); setCover(image); }}
              onCoverError={setCoverError}
              onContinue={() => continueFrom(1, basicsErrors, 2)}
            />
          ) : step === 2 ? (
            <RewardsStep
              budget={budget}
              reward={reward}
              rewardType={rewardType}
              onRewardTypeChange={setRewardType}
              platforms={platforms}
              maxPerCreator={maxPerCreator}
              onBudgetChange={setBudget}
              onRewardChange={setReward}
              onPlatformsChange={(value) => { setPlatforms(value); touch('platforms'); }}
              // Over the budget is a clash, not a gap: it shows as soon as it happens.
              onMaxPerCreatorChange={(value) => { setMaxPerCreator(value); touch('maxPerCreator'); }}
              onBlurField={touch}
              errors={shown(2, rewardsErrors)}
              onContinue={() => continueFrom(2, rewardsErrors, 3)}
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
              goals={goals}
              audience={audience}
              onGoalsChange={setGoals}
              onAudienceChange={setAudience}
              onBriefChange={setBrief}
              onHashtagsChange={setHashtags}
              onHashtagDraftChange={setHashtagDraft}
              onMentionsChange={setMentions}
              onMentionDraftChange={setMentionDraft}
              onRuleDraftChange={setRuleDraft}
              onRuleAdd={addRule}
              onRuleRemove={(rule) => setContentRules((current) => current.filter((entry) => entry !== rule))}
              onReferencesChange={setReferences}
              onBlurField={touch}
              errors={shown(3, requirementsErrors)}
              onContinue={() => continueFrom(3, requirementsErrors, 'review')}
              onDraftWithAi={() => setAiBriefOpen(true)}
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
      <AiBriefDialog
        open={aiBriefOpen}
        onClose={() => setAiBriefOpen(false)}
        title={title}
        platforms={platforms}
        contentType={campaignType}
        onApply={(draft) => void applyAiDraft(draft)}
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
  visibility: CampaignVisibility;
  categoryId: string;
  categories: CampaignCategory[];
  categoriesLoading: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  title: string;
  cover: PickedImage | null;
  coverError: string | null;
  onCampaignTypeChange: (value: CampaignContentType) => void;
  onVisibilityChange: (value: CampaignVisibility) => void;
  onCategoryChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  errors: FieldErrors<BasicsField>;
  onCoverChange: (value: PickedImage | null) => void;
  onCoverError: (message: string) => void;
  onContinue: () => void;
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
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-text-muted">Who can join</p>
        <SegmentedToggle options={VISIBILITY_OPTIONS} value={props.visibility} onChange={props.onVisibilityChange} ariaLabel="Who can join this campaign" />
        <p className="text-xs text-text-muted">{VISIBILITY_HINT[props.visibility]}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-text-muted">
          Campaign Category
          <select
            id={fieldId('category')}
            value={props.categoryId}
            onChange={(event) => props.onCategoryChange(event.target.value)}
            aria-invalid={props.errors.category ? true : undefined}
            className={cn('h-12 rounded-xl border bg-surface-raised px-4 text-[15px] text-text', props.errors.category ? 'border-danger' : 'border-border')}
          >
            <option value="">{props.categoriesLoading ? 'Loading categories…' : 'Select category'}</option>
            {props.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <FieldError>{props.errors.category}</FieldError>
      </div>
      <Field label="Campaign Start Date (optional — starts today if empty)" type="date" min={new Date().toISOString().slice(0, 10)} value={props.startDate} onChange={(event) => props.onStartDateChange(event.target.value)} />
      <Field
        label="Campaign End Date"
        type="date"
        min={props.startDate || new Date().toISOString().slice(0, 10)}
        value={props.endDate}
        onChange={(event) => props.onEndDateChange(event.target.value)}
        id={fieldId('endDate')}
        error={props.errors.endDate}
      />
      <Field
        id={fieldId('title')}
        label="Campaign Title"
        placeholder="e.g. Summer Skincare Launch"
        maxLength={TITLE_MAX}
        value={props.title}
        onChange={(event) => props.onTitleChange(event.target.value)}
        onBlur={props.onTitleBlur}
        error={props.errors.title}
      />
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-text-muted">Cover Image</p>
        <ImageUpload value={props.cover} onChange={props.onCoverChange} onError={props.onCoverError} label="Upload cover image" height={180} />
      </div>
      {props.coverError ? <p className="text-xs text-danger">{props.coverError}</p> : null}
      <Button onClick={props.onContinue}>Next Step</Button>
    </div>
  );
}

interface RewardsProps {
  budget: string;
  reward: string;
  rewardType: RewardType;
  onRewardTypeChange: (value: RewardType) => void;
  platforms: SocialPlatform[];
  maxPerCreator: string;
  onBudgetChange: (value: string) => void;
  onRewardChange: (value: string) => void;
  onPlatformsChange: (value: SocialPlatform[]) => void;
  onMaxPerCreatorChange: (value: string) => void;
  onBlurField: (field: RewardsField) => void;
  errors: FieldErrors<RewardsField>;
  onContinue: () => void;
}

function RewardsStep(props: RewardsProps) {
  return (
    <div className="flex flex-col gap-5">
      <StepHeading title="Reward & Platforms" subtitle="Set your budget and where creators should post." />
      <Field id={fieldId('budget')} label="Total Reward Budget" inputMode="decimal" placeholder="0.00" value={props.budget} onChange={(event) => props.onBudgetChange(event.target.value)} onBlur={() => props.onBlurField('budget')} error={props.errors.budget} />
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-text-muted">How creators are paid</p>
        <SegmentedToggle options={REWARD_TYPE_OPTIONS} value={props.rewardType} onChange={props.onRewardTypeChange} ariaLabel="How creators are paid" />
        <p className="text-xs text-text-muted">{REWARD_TYPE_HINT[props.rewardType]}</p>
      </div>
      <Field label={props.rewardType === 'per_item' ? 'Reward Per Approved Post' : 'Reward Per 1,000 Views'} inputMode="decimal" placeholder="0.00" value={props.reward} onChange={(event) => props.onRewardChange(event.target.value)} onBlur={() => props.onBlurField('reward')} error={props.errors.reward} id={fieldId('reward')} />
      <div className="flex flex-col gap-1.5">
        <Field id={fieldId('maxPerCreator')} label="Maximum Reward Per Creator (optional)" inputMode="decimal" placeholder="0.00" value={props.maxPerCreator} onChange={(event) => props.onMaxPerCreatorChange(event.target.value)} error={props.errors.maxPerCreator} />
        {props.errors.maxPerCreator ? null : (
          <p className="text-xs text-text-muted">The most one creator can earn from this campaign. Leave empty for no limit.</p>
        )}
      </div>
      <div id={fieldId('platforms')} tabIndex={-1} className="flex flex-col gap-2 outline-none">
        <p className="text-[13px] font-medium text-text-muted">Platforms</p>
        <MultiChoiceChips choices={PLATFORMS} value={props.platforms} onChange={props.onPlatformsChange} accessibilityLabel="Platforms" />
        <p role={props.errors.platforms ? 'alert' : undefined} className={cn('text-xs', props.errors.platforms ? 'text-danger' : 'text-text-muted')}>
          {props.errors.platforms ?? 'Select every platform creators can post on.'}
        </p>
      </div>
      <Button onClick={props.onContinue}>Next Step</Button>
    </div>
  );
}

interface RequirementsProps {
  brief: string;
  goals: string;
  audience: string;
  onGoalsChange: (value: string) => void;
  onAudienceChange: (value: string) => void;
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
  onBlurField: (field: RequirementsField) => void;
  errors: FieldErrors<RequirementsField>;
  onContinue: () => void;
  onDraftWithAi: () => void;
}

function RequirementsStep(props: RequirementsProps) {
  return (
    <div className="flex flex-col gap-5">
      <StepHeading title="Content Requirements" subtitle="Give creators a clear brief and posting guidelines." />
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-4 sm:flex-row sm:items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15" aria-hidden>
          <Sparkles className="size-5 text-green-text" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text">Draft with AI</p>
          <p className="text-sm text-text-muted">Describe what you&apos;re promoting and get a first draft of everything below.</p>
        </div>
        <Button variant="secondary" size="sm" fullWidth={false} onClick={props.onDraftWithAi}>
          <Sparkles className="size-4" aria-hidden /> Draft with AI
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        <Textarea
          id={fieldId('brief')}
          label="Campaign Brief"
          placeholder="Describe what creators should make…"
          maxLength={BRIEF_MAX}
          value={props.brief}
          onChange={(event) => props.onBriefChange(event.target.value)}
          onBlur={() => props.onBlurField('brief')}
          error={props.errors.brief}
        />
        {props.errors.brief ? null : <BriefLength brief={props.brief} />}
      </div>
      <Textarea label="Campaign Goals (Optional)" placeholder="e.g. Drive awareness of the summer range" maxLength={2000} value={props.goals} onChange={(event) => props.onGoalsChange(event.target.value)} />
      <AudienceFields value={props.audience} onChange={props.onAudienceChange} />
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
      <Textarea
        id={fieldId('references')}
        label="Reference Materials (Optional)"
        placeholder={'https://…/product-shots.zip\nhttps://…/demo-video.mp4'}
        value={props.references}
        onChange={(event) => props.onReferencesChange(event.target.value)}
        onBlur={() => props.onBlurField('references')}
        error={props.errors.references}
      />
      <p className="-mt-3 text-xs text-text-muted">Paste links to videos, images, or files creators should use — one per line.</p>
      <Button onClick={props.onContinue}>Review Campaign</Button>
    </div>
  );
}

/** The brief's length against its minimum, so the rule is known before it is broken. */
function BriefLength({ brief }: { brief: string }) {
  const length = brief.trim().length;
  return (
    <p className="text-xs text-text-tertiary">
      {length < BRIEF_MIN ? `At least ${BRIEF_MIN} characters · ${length} so far` : `${length.toLocaleString('en')} characters`}
    </p>
  );
}

function FieldError({ children }: { children?: ReactNode }) {
  return children ? <span className="text-xs text-danger">{children}</span> : null;
}

/** The element id of a form field, for scrolling to it and focusing it. */
function fieldId(field: CampaignField): string {
  return `campaign-${field}`;
}

/** A yyyy-mm-dd date input value as local midnight. */
function localDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
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
  visibility: CampaignVisibility;
  category: string;
  startDate: string;
  endDate: string;
  goals: string;
  audience: string;
  rewardType: RewardType;
  platforms: SocialPlatform[];
  maxPerCreator: Money;
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

/**
 * The last step before funding: everything the brand entered, one card per wizard step.
 * Short facts (dates, money) sit beside their label; anything that can run long (title,
 * brief, goals, rules, tags, links) gets the full width under its label, so long text
 * wraps cleanly instead of squeezing into a narrow right-hand column.
 */
function ReviewStep(props: ReviewProps) {
  const goals = props.goals.trim();
  const audience = props.audience.trim();
  const hashtags = props.hashtags.split(/\s+/).filter(Boolean);
  const mentions = props.mentions.split(/\s+/).filter(Boolean);
  const references = parseReferences(props.references);
  return (
    <div className="flex flex-col gap-5">
      <StepHeading title="Review Campaign" subtitle="Make sure everything looks right before publishing." />
      <ReviewSection title="Campaign Basics" onEdit={() => props.onEdit(1)}>
        <ReviewBlock label="Campaign Title"><p className="text-[15px] text-text">{props.title.trim()}</p></ReviewBlock>
        <ReviewRow label="Campaign Type" value={props.campaignType === 'ugc' ? 'UGC' : 'Clipping'} />
        <ReviewRow label="Visibility" value={props.visibility === 'public' ? 'Public' : 'Invite only'} />
        <ReviewRow label="Category" value={props.category} />
        <ReviewRow label="Start Date" value={props.startDate ? formatDateDMY(props.startDate) : 'Today'} />
        <ReviewRow label="End Date" value={formatDateDMY(props.endDate)} />
      </ReviewSection>
      <ReviewSection title="Reward & Platforms" onEdit={() => props.onEdit(2)}>
        <ReviewRow label="Total Budget" value={formatMoney(props.budget)} />
        <ReviewRow label="Reward" value={formatCampaignReward({ rewardType: props.rewardType, ratePerThousandViews: props.reward })} />
        <ReviewRow label="Max Per Creator" value={props.maxPerCreator.minorUnits > 0 ? formatMoney(props.maxPerCreator) : 'No limit'} />
        <ReviewBlock label="Platforms"><Chips items={props.platforms.map(platformLabel)} /></ReviewBlock>
      </ReviewSection>
      <ReviewSection title="Content Requirements" onEdit={() => props.onEdit(3)}>
        <ReviewBlock label="Campaign Brief"><FoldingText text={props.brief.trim()} /></ReviewBlock>
        {goals ? <ReviewBlock label="Goals"><p className="whitespace-pre-line text-sm text-text">{goals}</p></ReviewBlock> : null}
        {audience ? <ReviewRow label="Audience" value={audience} /> : null}
        {props.contentRules.length ? (
          <ReviewBlock label={`Content Rules (${props.contentRules.length})`}>
            <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-sm text-text marker:text-text-muted">
              {props.contentRules.map((rule, index) => <li key={`${index}-${rule}`}>{rule}</li>)}
            </ol>
          </ReviewBlock>
        ) : null}
        {hashtags.length ? <ReviewBlock label="Hashtags"><Chips items={hashtags} /></ReviewBlock> : null}
        {mentions.length ? <ReviewBlock label="Mentions"><Chips items={mentions} /></ReviewBlock> : null}
        {references.length ? (
          <ReviewBlock label={`Reference Materials (${references.length})`}>
            <ul className="flex flex-col gap-1.5">
              {references.map((reference) => (
                <li key={reference.id} className="min-w-0">
                  <a href={reference.url} target="_blank" rel="noreferrer" title={reference.url} className="block truncate text-sm text-green-text hover:underline">{reference.name}</a>
                </li>
              ))}
            </ul>
          </ReviewBlock>
        ) : null}
      </ReviewSection>
      <Card className="bg-primary/10 text-sm">Your wallet will only be charged when you fund and launch this campaign.</Card>
      {props.error ? <p className="text-xs text-danger">{props.error}</p> : null}
      <Button loading={props.loading} onClick={props.onContinue}>Continue to Funding</Button>
    </div>
  );
}

/** One wizard step's answers in a card, with a way back to change them. */
function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <Card>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${title}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-green-text hover:bg-primary/20"
        >
          <Pencil className="size-3.5" aria-hidden /> Edit
        </button>
      </div>
      <dl className="flex flex-col divide-y divide-border [&>*]:py-3 [&>*:last-child]:pb-0">{children}</dl>
    </Card>
  );
}

/** A short fact beside its label; the value wraps rather than running past the edge. */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="shrink-0 text-sm text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm text-text">{value}</dd>
    </div>
  );
}

/** Anything that can run long: the label above, the content across the full width. */
function ReviewBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

/** Long text shown in part (six lines), with a toggle to read all of it. */
function FoldingText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [foldable, setFoldable] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  // Re-measured whenever the width changes: a brief that fits on a wide screen may need
  // folding on a narrow one.
  useEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return;
    const check = () => setFoldable(element.scrollHeight > element.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, text]);
  return (
    <div className="flex flex-col gap-1.5">
      <p ref={textRef} className={cn('whitespace-pre-line text-sm text-text', expanded ? '' : 'line-clamp-6')}>{text}</p>
      {foldable || expanded ? (
        <button type="button" onClick={() => setExpanded((current) => !current)} className="self-start text-sm font-medium text-green-text hover:underline">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="max-w-full break-all rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium text-text-muted">{item}</span>
      ))}
    </div>
  );
}

type FundingStep = 'confirm' | 'processing' | 'pending' | 'failed';
type PayMethod = 'wallet' | 'card';

function FundingDialog({ campaign, onClose, onViewDraft, onPublished }: { campaign: Campaign | null; onClose: () => void; onViewDraft: () => void; onPublished: (campaign: Campaign) => void }) {
  const fund = useFundCampaign();
  const fundFromWallet = useFundFromWallet();
  const publish = useSetCampaignStatus(campaign?.id ?? '');
  const billing = useBrandBilling().data;
  const feeBps = billing?.platformFeeBps;
  // The wallet holds one currency; it can pay for campaigns in that currency only.
  const wallet = billing?.walletBalance;
  const walletUsable = Boolean(
    campaign && wallet && wallet.currency === campaign.budget.currency && wallet.minorUnits > 0,
  );
  const [method, setMethod] = useState<PayMethod | null>(null);
  const payWith: PayMethod =
    method ?? (walletUsable && campaign && wallet && wallet.minorUnits >= campaign.budget.minorUnits ? 'wallet' : 'card');
  const [state, setState] = useState<FundingStep>('confirm');
  const [message, setMessage] = useState('');

  async function fundAndPublish() {
    if (!campaign) return;
    setState('processing');
    setMessage('');
    try {
      if (walletUsable && payWith === 'wallet') {
        await fundFromWallet.mutateAsync({ campaignId: campaign.id, amount: campaign.budget });
        onPublished(await publish.mutateAsync('live'));
        return;
      }
      const funding = await fund.mutateAsync({ campaignId: campaign.id, amount: campaign.budget, client: 'web' });
      if (funding.status === 'failed') {
        setMessage('Your payment could not be completed. Please try again.');
        setState('failed');
        return;
      }
      if (funding.status === 'pending') {
        setMessage('Taking you to Stripe to pay. You will come back here and the campaign goes live once the payment clears.');
        setState('pending');
        if (funding.checkoutUrl) window.location.assign(funding.checkoutUrl);
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
            <ReviewLine label="Campaign budget" value={formatMoney(campaign.budget)} />
            {feeBps ? <ReviewLine label="Platform fee" value={`${feeBps / 100}% of the budget, added ${payWith === 'wallet' ? 'from your wallet' : 'at checkout'}`} /> : null}
            {walletUsable ? null : <ReviewLine label="Payment method" value="Card, on Stripe" />}
          </Card>
          {walletUsable && wallet ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text">Pay with</p>
              <SegmentedToggle<PayMethod>
                ariaLabel="Payment method"
                options={[
                  { value: 'wallet', label: `Wallet · ${formatMoney(wallet)}` },
                  { value: 'card', label: 'Card' },
                ]}
                value={payWith}
                onChange={setMethod}
              />
              <p className="text-xs text-text-muted">
                {payWith === 'wallet' ? 'Paid from your balance straight away. No card needed.' : 'Secure card payment on Stripe.'}
              </p>
            </div>
          ) : null}
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
        <ReviewLine label="Reward" value={formatCampaignReward(campaign)} />
        <ReviewLine label="Platforms" value={platformsLabel(campaign.platforms)} />
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
