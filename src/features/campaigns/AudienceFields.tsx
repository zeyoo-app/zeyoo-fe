'use client';

import { useId } from 'react';

import {
  AUDIENCE_AGES,
  AUDIENCE_GENDERS,
  formatAudience,
  isListAudience,
  parseAudience,
  type AudienceAge,
  type AudienceGender,
} from './audience';

const SELECT_CLASS =
  'h-12 w-full rounded-xl border border-border bg-surface-raised px-4 text-[15px] text-text focus:border-primary focus:outline-none';

/**
 * Target audience as two lists — gender and age range — instead of free text. The
 * choice is saved as one readable line ("Female, 18–24"), so creators and the backend
 * see the same text.
 */
export function AudienceFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const genderId = useId();
  const ageId = useId();
  const selection = parseAudience(value);
  // An older campaign may hold typed text the lists cannot express; it is kept as-is
  // until the brand picks from the lists.
  const legacy = isListAudience(value) ? null : value.trim();
  const current = legacy ? { gender: null, age: null } : selection;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-medium text-text-muted">Target Audience (Optional)</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={genderId} className="text-xs text-text-muted">Gender</label>
          <select
            id={genderId}
            className={SELECT_CLASS}
            value={current.gender ?? ''}
            onChange={(event) =>
              onChange(formatAudience({ ...current, gender: (event.target.value || null) as AudienceGender | null }))
            }
          >
            <option value="">Select gender</option>
            {AUDIENCE_GENDERS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ageId} className="text-xs text-text-muted">Age range</label>
          <select
            id={ageId}
            className={SELECT_CLASS}
            value={current.age ?? ''}
            onChange={(event) =>
              onChange(formatAudience({ ...current, age: (event.target.value || null) as AudienceAge | null }))
            }
          >
            <option value="">Select age</option>
            {AUDIENCE_AGES.map((age) => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>
      </div>
      {legacy ? (
        <p className="text-xs text-text-muted">Currently: “{legacy}”. Pick a gender or age range to replace it.</p>
      ) : null}
    </div>
  );
}
