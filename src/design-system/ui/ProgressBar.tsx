'use client';

import { cn } from '../lib/cn';

interface ProgressBarProps {
  /** 0–1. Clamped. */
  value: number;
  tone?: 'accent' | 'warning' | 'danger';
  /** Exposed for assistive tech, e.g. "72% of budget spent". */
  label?: string;
}

const FILL_CLASSES = {
  accent: 'bg-primary',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

/** Thin progress track — used for budget spend and per-creator cap. */
export function ProgressBar({ value, tone = 'accent', label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className="h-1.5 overflow-hidden rounded-full bg-surface-hover"
    >
      <div
        className={cn('h-full rounded-full transition-[width]', FILL_CLASSES[tone])}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
