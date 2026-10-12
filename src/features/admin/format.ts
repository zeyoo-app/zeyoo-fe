import type { MoneyTotal } from '@/shared/api';
import { formatMoney } from '@/shared/money/money';

export function formatMinor(amountMinor: number, currencyCode: string): string {
  return formatMoney({ minorUnits: amountMinor, currency: currencyCode });
}

/** One amount per currency, or "$0.00" when there is nothing yet. */
export function formatTotals(totals: MoneyTotal[]): string {
  if (totals.length === 0) return formatMinor(0, 'USD');
  return totals.map((total) => formatMinor(total.amountMinor, total.currencyCode)).join(' · ');
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
