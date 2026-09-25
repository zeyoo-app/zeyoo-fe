import type { ReactNode } from 'react';

import { Skeleton } from '../ui/Skeleton';

interface AsyncContentProps<T> {
  isLoading: boolean;
  isError: boolean;
  data: T | undefined;
  children: (data: T) => ReactNode;
  skeleton?: ReactNode;
}

const DEFAULT_SKELETON = (
  <div className="flex flex-col gap-3">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

/** Renders one of loading / error / ready states for a TanStack Query result. */
export function AsyncContent<T>({ isLoading, isError, data, children, skeleton }: AsyncContentProps<T>) {
  if (isLoading) return <>{skeleton ?? DEFAULT_SKELETON}</>;
  if (isError || data === undefined) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-text-muted">
        Something went wrong. Please try again.
      </div>
    );
  }
  return <>{children(data)}</>;
}
