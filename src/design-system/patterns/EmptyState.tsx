import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Contextual artwork in a raised circle above the title. */
  icon?: ReactNode;
  /** Fills the viewport height — for whole screens with nothing to show yet. */
  spacious?: boolean;
}

/** A centered placeholder for empty lists and zero-result states. */
export function EmptyState({ title, description, action, icon, spacious = false }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center ${
        spacious ? 'min-h-[360px] justify-center' : ''
      }`}
    >
      {icon ? (
        <span className="mb-3 flex size-[72px] items-center justify-center rounded-full bg-surface-raised text-[32px] leading-none">
          {icon}
        </span>
      ) : null}
      <p className="font-display text-lg font-semibold text-text">{title}</p>
      {description ? <p className="max-w-sm text-sm text-text-muted">{description}</p> : null}
      {action}
    </div>
  );
}
