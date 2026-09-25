/**
 * Money + metric formatting. All amounts are integer minor units + an ISO currency
 * code, exactly as the API returns them — the client never does earnings math
 * (IMPLEMENTATION_PLAN §6, contract §1.5). These functions only *format* server truth.
 */

export interface Money {
  /** Smallest currency unit, e.g. cents. Always an integer. */
  minorUnits: number;
  /** ISO 4217 code, e.g. 'USD'. */
  currency: string;
}

const MINOR_UNITS_PER_MAJOR = 100;

/** "$37.20" — a currency amount, locale- and currency-aware. */
export function formatMoney(money: Money, locale?: string): string {
  const major = money.minorUnits / MINOR_UNITS_PER_MAJOR;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
  }).format(major);
}

/** "2.4K", "285K", "1.2M" — a compact view/engagement count. */
export function formatCount(count: number, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(count);
}

/** "$3.00 / 1K views" — a campaign's reward rate, expressed per 1,000 views. */
export function formatRatePerThousandViews(rate: Money, locale?: string): string {
  return `${formatMoney(rate, locale)} / 1K views`;
}
