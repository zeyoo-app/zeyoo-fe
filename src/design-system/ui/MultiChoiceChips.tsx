'use client';

import { cn } from '../lib/cn';
import type { Choice } from './ChoiceChips';

interface MultiChoiceChipsProps<TValue extends string> {
  choices: Choice<TValue>[];
  value: TValue[];
  onChange: (value: TValue[]) => void;
  accessibilityLabel: string;
}

/** Like ChoiceChips, but any number of chips can be on; clicking toggles one. */
export function MultiChoiceChips<TValue extends string>({
  choices,
  value,
  onChange,
  accessibilityLabel,
}: MultiChoiceChipsProps<TValue>) {
  return (
    <div role="group" aria-label={accessibilityLabel} className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const selected = value.includes(choice.value);
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onChange(selected ? value.filter((item) => item !== choice.value) : [...value, choice.value])
            }
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
