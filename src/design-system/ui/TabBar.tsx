'use client';

import { cn } from '../lib/cn';

export interface TabItem<TValue extends string> {
  value: TValue;
  label: string;
  /** Items waiting on the viewer; shown as a small count when above zero. */
  badge?: number;
}

/**
 * Standard top tabs for switching between views of one page: equal-width labels over
 * a hairline, the active tab marked by an accent underline. For a two-way setting
 * (visibility, reward type) use SegmentedToggle instead.
 */
export function TabBar<TValue extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: {
  tabs: TabItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex border-b border-border">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        const badge = tab.badge ?? 0;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              '-mb-px flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 pb-3 pt-2 text-sm font-medium transition-colors',
              selected ? 'border-primary text-text' : 'border-transparent text-text-muted hover:text-text',
            )}
          >
            <span className="truncate">{tab.label}</span>
            {badge > 0 ? (
              <span
                className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-on-primary"
                aria-label={`${badge} waiting`}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
