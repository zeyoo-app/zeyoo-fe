'use client';

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

import type { BrandLedgerEntry } from '@/shared/api';
import { formatMoney } from '@/shared/money/money';
import { formatRelativeTime } from '@/shared/format/relativeTime';

/** A single brand wallet movement: what it was for, when, and the signed amount. */
export function BrandActivityRow({ entry }: { entry: BrandLedgerEntry }) {
  const isCredit = entry.amount.minorUnits >= 0;

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised">
        {isCredit ? (
          <ArrowDownLeft className="size-[18px] text-green-text" aria-hidden />
        ) : (
          <ArrowUpRight className="size-[18px] text-text-muted" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-text">{entry.description}</p>
        <p className="text-xs text-text-tertiary">{formatRelativeTime(entry.date)}</p>
      </div>
      <span className={isCredit ? 'font-numeric text-[15px] text-green-text' : 'font-numeric text-[15px] text-text'}>
        {isCredit ? '+' : ''}
        {formatMoney(entry.amount)}
      </span>
    </div>
  );
}
