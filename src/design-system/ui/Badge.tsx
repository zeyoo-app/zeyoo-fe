import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-raised text-text-muted',
  success: 'bg-primary text-on-primary',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  accent: 'bg-primary/15 text-green-text',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/** A small status pill. Success uses the filled green with near-black text. */
export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    />
  );
}
