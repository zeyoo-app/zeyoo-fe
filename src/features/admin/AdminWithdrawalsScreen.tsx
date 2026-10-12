'use client';

import { useState } from 'react';

import {
  AsyncContent,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  SegmentedToggle,
  Textarea,
  useConfirm,
  type BadgeTone,
} from '@/design-system';
import type { AdminWithdrawal } from '@/shared/api';

import { AdminPageHeader, DataTable, Pager, type Column } from './DataTable';
import { formatDateTime, formatMinor } from './format';
import { useAdminWithdrawals, useDecideWithdrawal } from './hooks';

type Scope = 'open' | 'history';

const SCOPES = [
  { value: 'open' as const, label: 'To decide' },
  { value: 'history' as const, label: 'History' },
];

const TONE: Record<AdminWithdrawal['status'], BadgeTone> = {
  REQUESTED: 'warning',
  HELD: 'neutral',
  PAID: 'success',
  REJECTED: 'danger',
};
const LABEL: Record<AdminWithdrawal['status'], string> = {
  REQUESTED: 'Waiting',
  HELD: 'On hold',
  PAID: 'Paid',
  REJECTED: 'Rejected',
};

export function AdminWithdrawalsScreen() {
  const [scope, setScope] = useState<Scope>('open');
  const [page, setPage] = useState(1);
  const query = useAdminWithdrawals(scope, page);

  return (
    <>
      <AdminPageHeader
        title="Withdrawals"
        subtitle="Creators asking to be paid. Approving sends the money to their bank through Stripe; rejecting returns it to their balance."
      />
      <div className="mb-4">
        <SegmentedToggle
          options={SCOPES}
          value={scope}
          onChange={(value) => {
            setScope(value);
            setPage(1);
          }}
          ariaLabel="Which withdrawals to show"
        />
      </div>
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(result) =>
          scope === 'open' ? (
            <OpenQueue withdrawals={result.items} />
          ) : (
            <>
              <History withdrawals={result.items} />
              <Pager page={result.page} pageSize={result.pageSize} total={result.total} onPage={setPage} />
            </>
          )
        }
      </AsyncContent>
    </>
  );
}

function OpenQueue({ withdrawals }: { withdrawals: AdminWithdrawal[] }) {
  const decide = useDecideWithdrawal();
  const confirm = useConfirm();
  const [holding, setHolding] = useState<AdminWithdrawal | null>(null);
  const [reason, setReason] = useState('');

  const run = (withdrawal: AdminWithdrawal, action: 'approve' | 'reject' | 'release') =>
    decide.mutate({ withdrawalId: withdrawal.id, action });

  const approve = async (withdrawal: AdminWithdrawal) => {
    const confirmed = await confirm({
      title: `Pay ${formatMinor(withdrawal.amountMinor, withdrawal.currencyCode)}?`,
      message: `${withdrawal.creatorName} will be paid through Stripe. This moves real money and cannot be undone.`,
      confirmLabel: 'Approve and pay',
    });
    if (confirmed) run(withdrawal, 'approve');
  };

  const reject = async (withdrawal: AdminWithdrawal) => {
    const confirmed = await confirm({
      title: 'Reject this withdrawal?',
      message: `The ${formatMinor(withdrawal.amountMinor, withdrawal.currencyCode)} goes back to ${withdrawal.creatorName}'s balance.`,
      confirmLabel: 'Reject',
      tone: 'danger',
    });
    if (confirmed) run(withdrawal, 'reject');
  };

  if (withdrawals.length === 0) {
    return <EmptyState title="Nothing waiting" description="New withdrawal requests appear here." />;
  }

  return (
    <>
      {decide.error ? (
        <p className="mb-3 text-sm text-danger">
          {decide.error instanceof Error ? decide.error.message : 'Could not complete that action.'}
        </p>
      ) : null}
      <div className="flex flex-col gap-3">
        {withdrawals.map((withdrawal) => (
          <Card key={withdrawal.id} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-text">{withdrawal.creatorName}</p>
                <p className="truncate text-xs text-text-muted">{withdrawal.creatorEmail}</p>
              </div>
              <div className="text-end">
                <p className="font-numeric text-xl text-text">
                  {formatMinor(withdrawal.amountMinor, withdrawal.currencyCode)}
                </p>
                <Badge tone={TONE[withdrawal.status]}>{LABEL[withdrawal.status]}</Badge>
              </div>
            </div>
            <p className="text-xs text-text-muted">
              Requested {formatDateTime(withdrawal.createdAt)} ·{' '}
              {withdrawal.destinationAccountId
                ? 'Payout account connected'
                : 'No payout account: approval will fail until the creator connects one'}
            </p>
            {withdrawal.holdReason ? (
              <p className="text-sm text-warning">Held: {withdrawal.holdReason}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {withdrawal.status === 'REQUESTED' ? (
                <>
                  <Button
                    size="sm"
                    fullWidth={false}
                    loading={decide.isPending}
                    onClick={() => approve(withdrawal)}
                  >
                    Approve and pay
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth={false}
                    onClick={() => {
                      setReason('');
                      setHolding(withdrawal);
                    }}
                  >
                    Put on hold
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    fullWidth={false}
                    loading={decide.isPending}
                    onClick={() => run(withdrawal, 'release')}
                  >
                    Release hold
                  </Button>
                </>
              )}
              <Button size="sm" variant="danger" fullWidth={false} onClick={() => reject(withdrawal)}>
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={Boolean(holding)} onClose={() => setHolding(null)} title="Put on hold">
        <p className="text-sm text-text-muted">
          The money stays reserved until you release or reject it. Say why, for your own records.
        </p>
        <Textarea placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button
          disabled={reason.trim().length < 3}
          loading={decide.isPending}
          onClick={() => {
            if (!holding) return;
            decide.mutate(
              {
                withdrawalId: holding.id,
                action: 'hold',
                reason: reason.trim(),
              },
              { onSuccess: () => setHolding(null) },
            );
          }}
        >
          Hold withdrawal
        </Button>
      </Modal>
    </>
  );
}

function History({ withdrawals }: { withdrawals: AdminWithdrawal[] }) {
  const columns: Column<AdminWithdrawal>[] = [
    {
      header: 'Creator',
      cell: (withdrawal) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{withdrawal.creatorName}</p>
          <p className="truncate text-xs text-text-muted">{withdrawal.creatorEmail}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (withdrawal) => formatMinor(withdrawal.amountMinor, withdrawal.currencyCode),
    },
    {
      header: 'Outcome',
      cell: (withdrawal) => <Badge tone={TONE[withdrawal.status]}>{LABEL[withdrawal.status]}</Badge>,
    },
    {
      header: 'Decided by',
      cell: (withdrawal) => withdrawal.decidedByEmail ?? '—',
    },
    {
      header: 'Decided',
      cell: (withdrawal) => (withdrawal.decidedAt ? formatDateTime(withdrawal.decidedAt) : '—'),
    },
    {
      header: 'Stripe transfer',
      cell: (withdrawal) => (
        <span className="break-all font-mono text-xs text-text-muted">{withdrawal.transferId ?? '—'}</span>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={withdrawals}
      rowKey={(row) => row.id}
      emptyTitle="No decided withdrawals yet"
    />
  );
}
