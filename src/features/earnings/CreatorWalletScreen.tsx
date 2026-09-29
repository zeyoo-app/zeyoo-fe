'use client';

import { useState } from 'react';

import { AsyncContent, Button, Card, Field, Modal, PageHeader, StatCard } from '@/design-system';
import type { LedgerEntry, WalletSummary } from '@/shared/api';
import { formatMoney } from '@/shared/money/money';

import { useConnectPayout, useLedger, useRequestWithdrawal, useWallet } from './hooks';

const MINOR_UNITS_PER_MAJOR = 100;

export function CreatorWalletScreen() {
  const walletQuery = useWallet();
  const ledgerQuery = useLedger();

  return (
    <>
      <PageHeader title="Wallet" subtitle="Your earnings and payouts." />
      <AsyncContent isLoading={walletQuery.isLoading} isError={walletQuery.isError} data={walletQuery.data}>
        {(wallet) => <WalletBody wallet={wallet} />}
      </AsyncContent>

      <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-text">Earnings history</h2>
      <AsyncContent isLoading={ledgerQuery.isLoading} isError={ledgerQuery.isError} data={ledgerQuery.data}>
        {(entries) => (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <LedgerRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </AsyncContent>
    </>
  );
}

function WalletBody({ wallet }: { wallet: WalletSummary }) {
  const connect = useConnectPayout();
  const withdraw = useRequestWithdrawal();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard value={formatMoney(wallet.available)} label="Available" />
        <StatCard value={formatMoney(wallet.pending)} label="Pending" />
        <StatCard value={formatMoney(wallet.held)} label="On hold" />
        <StatCard value={formatMoney(wallet.lifetimeEarned)} label="Total earnings" />
      </div>

      <div className="mt-4">
        {wallet.payoutConnected ? (
          <Button fullWidth={false} disabled={wallet.available.minorUnits <= 0} onClick={() => setOpen(true)}>
            Withdraw
          </Button>
        ) : (
          <Button fullWidth={false} loading={connect.isPending} onClick={() => connect.mutate()}>
            Connect payouts to withdraw
          </Button>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Withdraw to bank">
        <p className="text-sm text-text-muted">Available: {formatMoney(wallet.available)}</p>
        <Field label="Amount ($)" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <Button
          loading={withdraw.isPending}
          disabled={!Number.parseFloat(amount)}
          onClick={() => {
            const minorUnits = Math.round(Number.parseFloat(amount) * MINOR_UNITS_PER_MAJOR);
            withdraw.mutate(
              { amount: { minorUnits, currency: wallet.available.currency } },
              { onSuccess: () => setOpen(false) },
            );
          }}
        >
          Confirm withdrawal
        </Button>
      </Modal>
    </>
  );
}

const KIND_LABEL: Record<LedgerEntry['kind'], string> = {
  earning: 'Earning',
  withdrawal: 'Withdrawal',
  funding: 'Funding',
  hold: 'Hold',
  release: 'Release',
};

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const positive = entry.amount.minorUnits >= 0;
  return (
    <Card className="flex items-center justify-between p-4">
      <div>
        <p className="text-sm font-medium text-text">{entry.description}</p>
        <p className="text-xs text-text-muted">
          {KIND_LABEL[entry.kind]} · {new Date(entry.date).toLocaleDateString()} · {entry.status}
        </p>
      </div>
      <span className={`font-numeric text-sm ${positive ? 'text-green-text' : 'text-text'}`}>
        {formatMoney(entry.amount)}
      </span>
    </Card>
  );
}
