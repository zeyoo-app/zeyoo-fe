import { cn } from '../lib/cn';

/** A tonal loading placeholder that pulses on the raised surface. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-raised', className)} />;
}
