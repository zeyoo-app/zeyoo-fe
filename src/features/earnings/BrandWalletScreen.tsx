'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { AsyncContent, Button, Card, Divider, Field, Modal, PageHeader, SectionHeader } from '@/design-system';
import { formatMoney } from '@/shared/money/money';

import { BrandActivityRow } from './BrandActivityRow';
import { useBrandBilling, useBrandLedger, useTopUpWallet } from './hooks';

/** The wallet holds US dollars; a top-up under $50 would lose a large share to card fees. */
const WALLET_CURRENCY = 'USD';
const MIN_TOP_UP_MINOR = 5_000;
const MINOR_UNITS_PER_MAJOR = 100;

/** Brand wallet: the prepaid balance, what has been funded and spent, and the movements. */
export function BrandWalletScreen() {
  const billing = useBrandBilling();
  const ledger = useBrandLedger();
  const params = useSearchParams();
  const returned = params.get('topup');
  const [adding, setAdding] = useState(false);

  return (
    <>
      <PageHeader eyebrow="Billing" title="Wallet" />
      {returned === 'success' ? (
        <Card className="mb-4 border-primary/40">
          <p className="text-sm text-text">
            Payment received. Your balance updates as soon as Stripe confirms it.
          </p>
        </Card>
      ) : null}
      {returned === 'cancelled' ? (
        <Card className="mb-4">
          <p className="text-sm text-text-muted">Top-up cancelled. Nothing was charged.</p>
        </Card>
      ) : null}
      <AsyncContent isLoading={billing.isLoading} isError={billing.isError} data={billing.data}>
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Available balance
              </p>
              <p className="font-numeric text-4xl leading-none tracking-tight text-green-text">
                {formatMoney(data.walletBalance ?? { minorUnits: 0, currency: WALLET_CURRENCY })}
              </p>
              <p className="text-xs text-text-muted">Spend it on campaigns at launch, with no card needed.</p>
              <Button fullWidth={false} onClick={() => setAdding(true)}>
                Add funds
              </Button>
            </Card>
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
          </div>
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

      <AddFundsDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

/** Add money to the brand wallet by card, through Stripe Checkout. */
function AddFundsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const topUp = useTopUpWallet();
  const [amount, setAmount] = useState('');
  const minorUnits = Math.round((Number.parseFloat(amount) || 0) * MINOR_UNITS_PER_MAJOR);
  const tooSmall = minorUnits > 0 && minorUnits < MIN_TOP_UP_MINOR;

  return (
    <Modal open={open} onClose={onClose} title="Add funds">
      <div className="flex flex-col gap-3">
        <Field
          label="Amount (USD)"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
        />
        <p className={tooSmall ? 'text-xs text-danger' : 'text-xs text-text-muted'}>
          The minimum top-up is $50.
        </p>
        <p className="text-sm text-text-muted">
          You pay by card on Stripe. Your balance can only be spent on Zeyoo campaigns; it can&apos;t
          be withdrawn. Unspent budget from closed campaigns comes back here.
        </p>
        {topUp.error ? (
          <p className="text-xs text-danger">
            {topUp.error instanceof Error ? topUp.error.message : 'Could not start the payment.'}
          </p>
        ) : null}
        <Button
          loading={topUp.isPending}
          disabled={minorUnits < MIN_TOP_UP_MINOR || topUp.isPending}
          onClick={() =>
            topUp.mutate({ minorUnits, currency: WALLET_CURRENCY }, { onSuccess: onClose })
          }
        >
          Continue to payment
        </Button>
      </div>
    </Modal>
  );
}
