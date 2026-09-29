'use client';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

/** Section title with an optional trailing text action (design.md §13, prompt 7). */
export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
      {actionLabel ? (
        <button type="button" onClick={onActionPress} className="text-sm font-medium text-green-text">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
