'use client';

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/** Multi-line counterpart to {@link Field}, sharing its surface and focus treatment. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={textareaId} className="text-[13px] font-medium text-text-muted">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          'min-h-24 rounded-xl border bg-surface-raised px-4 py-3 text-[15px] text-text',
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
