/**
 * A campaign's target audience, chosen from two lists instead of typed. The backend
 * keeps it as one line of text (creators read it, the AI writes it), so the choice is
 * stored as a readable line — "Female, 18–24" — and read back from that same line
 * when the campaign is edited.
 */

export type AudienceGender = 'male' | 'female' | 'both';

export type AudienceAge = '13–17' | '18–24' | '25–34' | '35–44' | '45–54' | '55+' | 'All ages';

export interface AudienceSelection {
  gender: AudienceGender | null;
  age: AudienceAge | null;
}

export const AUDIENCE_GENDERS: { value: AudienceGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'both', label: 'Both' },
];

export const AUDIENCE_AGES: AudienceAge[] = ['13–17', '18–24', '25–34', '35–44', '45–54', '55+', 'All ages'];

/** How each gender reads in the saved line; "Both" alone would not say both of what. */
const GENDER_TEXT: Record<AudienceGender, string> = {
  male: 'Male',
  female: 'Female',
  both: 'Male & female',
};

export const EMPTY_AUDIENCE: AudienceSelection = { gender: null, age: null };

/** "Female, 18–24", "Male & female", "25–34" — or '' when nothing is chosen. */
export function formatAudience({ gender, age }: AudienceSelection): string {
  return [gender ? GENDER_TEXT[gender] : null, age].filter(Boolean).join(', ');
}

/**
 * The selection a saved line describes. Reads back {@link formatAudience}'s own
 * output, and the plain wording an AI draft or an older campaign tends to use
 * ("Women 18–24"); anything it cannot place is left unselected.
 */
export function parseAudience(text: string | null | undefined): AudienceSelection {
  const normalized = (text ?? '').toLowerCase().replace(/\s*[-—–]\s*/g, '–');
  return { gender: genderIn(normalized), age: ageIn(normalized) };
}

/** Whether a saved line is exactly what the two lists would write, so nothing is lost by re-saving. */
export function isListAudience(text: string | null | undefined): boolean {
  const trimmed = (text ?? '').trim();
  return trimmed === '' || formatAudience(parseAudience(trimmed)) === trimmed;
}

function genderIn(text: string): AudienceGender | null {
  if (/\bboth\b|male & female|male and female|men and women|women and men|all genders|everyone/.test(text)) {
    return 'both';
  }
  const female = /\b(female|females|women|woman|girls)\b/.test(text);
  const male = /\b(male|males|men|man|boys)\b/.test(text);
  if (female && male) return 'both';
  if (female) return 'female';
  if (male) return 'male';
  return null;
}

function ageIn(text: string): AudienceAge | null {
  return AUDIENCE_AGES.find((age) => text.includes(age.toLowerCase())) ?? null;
}
