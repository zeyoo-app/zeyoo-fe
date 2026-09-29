'use client';

import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

import { cn } from '../lib/cn';

interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** `danger` is for destructive rows like signing out. */
  tone?: 'default' | 'danger';
  onPress?: () => void;
}

/** A tappable row for settings and navigation lists; shows a chevron when pressable. */
export function ListRow({ title, subtitle, leading, trailing, tone = 'default', onPress }: ListRowProps) {
  const content = (
    <div className="flex items-center gap-3 py-3.5">
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <p className={cn('text-[15px]', tone === 'danger' ? 'text-danger' : 'text-text')}>{title}</p>
        {subtitle ? <p className="text-xs text-text-muted">{subtitle}</p> : null}
      </div>
      {trailing ?? (onPress ? <ChevronRight className="size-5 shrink-0 text-text-tertiary" /> : null)}
    </div>
  );

  if (!onPress) return content;

  return (
    <button type="button" onClick={onPress} aria-label={title} className="block w-full text-start">
      {content}
    </button>
  );
}
