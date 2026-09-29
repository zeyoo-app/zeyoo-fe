'use client';

import type { ReactNode } from 'react';
import { useId } from 'react';

import { cn } from '../lib/cn';

interface SelectFieldProps {
  label: string;
  /** Formatted display text. Empty string falls back to the placeholder. */
  value: string;
  placeholder: string;
  onPress: () => void;
  accessibilityLabel: string;
  error?: string;
  /** Trailing affordance — a chevron for a list, a calendar for a date. */
  trailing?: ReactNode;
}

/**
 * A read-only field that opens a picker. `Field` cannot be reused directly because a
 * text box invites typing, but everything else — the box, the label, the error
 * treatment — is shared with it, so a select and a text field sit identically
 * (design.md §6). Every select-style field composes this rather than authoring
 * its own box.
 */
export function SelectField({
  label,
  value,
  placeholder,
  onPress,
  accessibilityLabel,
  error,
  trailing,
}: SelectFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium text-text-muted">
        {label}
      </label>
      <button
        type="button"
        id={id}
        aria-label={accessibilityLabel}
        aria-haspopup="listbox"
        onClick={onPress}
        className={cn(
          'flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border bg-surface-raised px-4 text-start text-[15px] transition-colors',
          'hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary',
          error ? 'border-danger' : 'border-border',
          value ? 'text-text' : 'text-text-tertiary',
        )}
      >
        {value || placeholder}
        {trailing}
      </button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
