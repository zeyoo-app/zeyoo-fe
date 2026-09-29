'use client';

import { AsyncContent, Card, Divider, PageHeader, SectionHeader } from '@/design-system';
import { formatMoney } from '@/shared/money/money';

import { BrandActivityRow } from './BrandActivityRow';
import { useBrandBilling, useBrandLedger } from './hooks';

/** Brand wallet: what has been funded and spent, and the movements behind it. */
export function BrandWalletScreen() {
  const billing = useBrandBilling();
  const ledger = useBrandLedger();

  return (
    <>
      <PageHeader eyebrow="Billing" title="Wallet" />
      <AsyncContent isLoading={billing.isLoading} isError={billing.isError} data={billing.data}>
        {(data) => (
          <Card className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Spend this month
            </p>
            <p className="font-numeric text-4xl leading-none tracking-tight text-text">
              {formatMoney(data.monthlySpend)}
            </p>
            <Divider />
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Total funded</span>
              <span className="font-numeric text-sm text-text">{formatMoney(data.totalFunded)}</span>
            </div>
          </Card>
        )}
      </AsyncContent>

      <div className="mt-6">
        <SectionHeader title="Recent activity" />
        <AsyncContent isLoading={ledger.isLoading} isError={ledger.isError} data={ledger.data}>
          {(entries) =>
            entries.length > 0 ? (
              <Card className="flex flex-col px-5 py-0">
                {entries.map((entry, index) => (
                  <div key={entry.id}>
                    <BrandActivityRow entry={entry} />
                    {index < entries.length - 1 ? <Divider /> : null}
                  </div>
                ))}
              </Card>
            ) : (
              <Card>
                <p className="text-sm text-text-muted">No transactions yet.</p>
              </Card>
            )
          }
        </AsyncContent>
      </div>
    </>
  );
}
