'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Labelled text field. Focus lifts the border to brand green; an error swaps it to
 * danger with helper text. The field sits on the raised surface so it reads as inset
 * without a shadow (design.md §6).
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-[13px] font-medium text-text-muted">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-12 rounded-xl border bg-surface-raised px-4 text-[15px] text-text',
          'placeholder:text-text-tertiary focus:outline-none focus:border-primary',
          error ? 'border-danger' : 'border-border',
          className,
        )}
        {...rest}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
});
