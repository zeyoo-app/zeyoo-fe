import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** A centered placeholder for empty lists and zero-result states. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
      <p className="font-display text-lg font-semibold text-text">{title}</p>
      {description ? <p className="max-w-sm text-sm text-text-muted">{description}</p> : null}
      {action}
    </div>
  );
}
