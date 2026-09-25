import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

/** A bordered surface panel. Elevation is the border + tonal step, never a shadow. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-surface p-5', className)}
      {...rest}
    />
  );
}
