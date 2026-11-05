'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { cn } from '../lib/cn';

export interface MenuAction {
  key: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  destructive?: boolean;
  onSelect: () => void;
}

/**
 * A "…" button that opens a small menu of actions under it. Closes on choosing an
 * action, clicking outside, or pressing Escape.
 */
export function ActionsMenu({ actions, ariaLabel }: { actions: MenuAction[]; ariaLabel: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-10 items-center justify-center rounded-full bg-surface-raised text-text transition-colors hover:bg-surface-hover"
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-12 z-20 min-w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  action.onSelect();
                }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors hover:bg-surface-hover',
                  action.destructive ? 'text-danger' : 'text-text',
                )}
              >
                {Icon ? <Icon className="size-4 shrink-0" /> : null}
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
