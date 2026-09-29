'use client';

import { cn } from '../lib/cn';

export interface Choice<TValue extends string> {
  value: TValue;
  label: string;
}

interface ChoiceChipsProps<TValue extends string> {
  choices: Choice<TValue>[];
  value: TValue | null;
  onChange: (value: TValue) => void;
  accessibilityLabel: string;
}

/** Wrapping row of selectable chips; the active chip fills with the brand green. */
export function ChoiceChips<TValue extends string>({
  choices,
  value,
  onChange,
  accessibilityLabel,
}: ChoiceChipsProps<TValue>) {
  return (
    <div role="group" aria-label={accessibilityLabel} className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(choice.value)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              selected
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-surface-raised text-text hover:bg-surface-hover',
            )}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
