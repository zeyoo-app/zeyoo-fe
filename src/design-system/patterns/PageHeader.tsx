import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/** The standard page title block: optional eyebrow, display title, subtitle, action. */
export function PageHeader({ eyebrow, title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold text-text sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
