'use client';

import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '../lib/cn';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectInputProps<T extends string> {
  label: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * A compact labelled dropdown that sits beside a Field at the same height, for
 * narrowing a list (status, sort) without another row of chips. Native under the
 * hood, so keyboard and screen-reader behaviour come for free.
 */
export function SelectInput<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SelectInputProps<T>) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className={cn(
            'h-12 w-full appearance-none rounded-xl border border-border bg-surface-raised ps-4 pe-10 text-[15px] text-text',
            'cursor-pointer hover:bg-surface-hover focus:border-primary focus:outline-none',
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
        />
      </div>
    </div>
  );
}
