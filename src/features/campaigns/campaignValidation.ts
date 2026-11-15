import type { Money } from '@/shared/api';

/**
 * What each step of the create-campaign wizard needs before it can move on, with a
 * plain message per missing field. The limits mirror the API's, so a campaign that
 * passes here is not turned away at publish.
 */

export const TITLE_MIN = 3;
export const TITLE_MAX = 140;
export const BRIEF_MIN = 11;
export const BRIEF_MAX = 5000;
export const REFERENCES_MAX = 10;

export type BasicsField = 'category' | 'endDate' | 'title';
export type RewardsField = 'budget' | 'reward' | 'maxPerCreator' | 'platforms';
export type RequirementsField = 'brief' | 'references';
export type CampaignField = BasicsField | RewardsField | RequirementsField;

/** Problems by field, in the order the fields appear on screen. */
export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export interface BasicsValues {
  hasCategory: boolean;
  startDate: Date | null;
  endDate: Date | null;
  title: string;
  now?: Date;
}

export function validateBasics(values: BasicsValues): FieldErrors<BasicsField> {
  const errors: FieldErrors<BasicsField> = {};
  if (!values.hasCategory) errors.category = 'Choose a category.';
  if (!values.endDate) {
    errors.endDate = 'Choose an end date.';
  } else if (values.endDate <= (values.startDate ?? values.now ?? new Date())) {
    errors.endDate = values.startDate
      ? 'The end date must be after the start date.'
      : 'The end date must be in the future.';
  }
  const title = values.title.trim();
  if (!title) errors.title = 'Add a campaign title.';
  else if (title.length < TITLE_MIN) errors.title = `Use at least ${TITLE_MIN} characters.`;
  else if (title.length > TITLE_MAX) errors.title = `Keep it to ${TITLE_MAX} characters.`;
  return errors;
}

export interface RewardsValues {
  budget: Money;
  reward: Money;
  maxPerCreator: Money;
  platformCount: number;
  perItem: boolean;
}

export function validateRewards(values: RewardsValues): FieldErrors<RewardsField> {
  const errors: FieldErrors<RewardsField> = {};
  if (values.budget.minorUnits <= 0) errors.budget = 'Enter a budget above zero.';
  if (values.reward.minorUnits <= 0) {
    errors.reward = values.perItem
      ? 'Enter how much each approved post earns.'
      : 'Enter how much creators earn per 1,000 views.';
  }
  if (values.maxPerCreator.minorUnits > values.budget.minorUnits) {
    errors.maxPerCreator = 'This cannot be more than the total budget.';
  }
  if (values.platformCount === 0) errors.platforms = 'Pick at least one platform.';
  return errors;
}

export interface RequirementsValues {
  brief: string;
  references: string;
}

export function validateRequirements(values: RequirementsValues): FieldErrors<RequirementsField> {
  const errors: FieldErrors<RequirementsField> = {};
  const brief = values.brief.trim();
  if (!brief) {
    errors.brief = 'Add a brief so creators know what to make.';
  } else if (brief.length < BRIEF_MIN) {
    errors.brief = `Add a little more: at least ${BRIEF_MIN} characters (${brief.length} so far).`;
  } else if (brief.length > BRIEF_MAX) {
    errors.brief = `Keep the brief to ${BRIEF_MAX.toLocaleString('en')} characters.`;
  }
  const links = referenceLines(values.references);
  const invalid = links.filter((line) => !isWebLink(line));
  const [onlyInvalid] = invalid;
  if (onlyInvalid !== undefined) {
    errors.references =
      invalid.length === 1
        ? `“${shorten(onlyInvalid)}” is not a full link. Links start with https://`
        : `${invalid.length} lines are not full links. Each link starts with https://`;
  } else if (links.length > REFERENCES_MAX) {
    errors.references = `Add up to ${REFERENCES_MAX} links.`;
  }
  return errors;
}

/** The first field with a problem, in screen order, or null when the step is complete. */
export function firstInvalid<TField extends string>(errors: FieldErrors<TField>): TField | null {
  return (Object.keys(errors)[0] as TField | undefined) ?? null;
}

export function referenceLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function isWebLink(value: string): boolean {
  return /^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]+/i.test(value);
}

function shorten(value: string): string {
  return value.length > 40 ? `${value.slice(0, 39)}…` : value;
}
