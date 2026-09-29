'use client';

import type { ReactNode } from 'react';

import { BackButton } from '@/shared/nav/BackButton';

interface StepHeaderProps {
  /** Null hides the "Step N of 3" indicator — the opening step leads with `leading` instead. */
  step: number | null;
  total: number;
  title?: string;
  subtitle?: string;
  leading?: ReactNode;
  /** Rendered above the progress line. The opening step uses `leading` instead. */
  onBack?: () => void;
}

/** Shared chrome for every step of a multi-step form: progress, title, copy. */
export function StepHeader({ step, total, title, subtitle, leading, onBack }: StepHeaderProps) {
  return (
    <div className="flex flex-col gap-1.5 pt-2 pb-1">
      {onBack ? (
        <div className="-ms-3">
          <BackButton onPress={onBack} />
        </div>
      ) : null}
      {leading}
      {step !== null ? <p className="text-xs text-text-muted">Step {step} of {total}</p> : null}
      {title ? <h1 className="font-display text-2xl font-semibold text-text">{title}</h1> : null}
      {subtitle ? <p className="text-[15px] text-text-muted">{subtitle}</p> : null}
    </div>
  );
}
