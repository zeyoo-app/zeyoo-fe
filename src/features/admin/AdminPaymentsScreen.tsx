'use client';

import { useState } from 'react';

import { AsyncContent, Badge, type BadgeTone } from '@/design-system';
import type { AdminFunding } from '@/shared/api';

import { AdminPageHeader, DataTable, Pager, type Column } from './DataTable';
import { formatDateTime, formatMinor } from './format';
import { useAdminFundings } from './hooks';

const TONE: Record<AdminFunding['status'], BadgeTone> = {
  SUCCEEDED: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
};
const LABEL: Record<AdminFunding['status'], string> = {
  SUCCEEDED: 'Paid',
  PENDING: 'Waiting for payment',
  FAILED: 'Failed or expired',
};

const COLUMNS: Column<AdminFunding>[] = [
  {
    header: 'Campaign',
    cell: (funding) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{funding.campaignTitle}</p>
        <p className="truncate text-xs text-text-muted">{funding.organizationName}</p>
      </div>
    ),
  },
  {
    header: 'Amount',
    cell: (funding) => formatMinor(funding.amountMinor, funding.currencyCode),
  },
  {
    header: 'Status',
    cell: (funding) => <Badge tone={TONE[funding.status]}>{LABEL[funding.status]}</Badge>,
  },
  { header: 'Started', cell: (funding) => formatDateTime(funding.createdAt) },
  {
    header: 'Stripe reference',
    cell: (funding) => (
      <span className="break-all font-mono text-xs text-text-muted">{funding.reference}</span>
    ),
  },
];

export function AdminPaymentsScreen() {
  const [page, setPage] = useState(1);
  const query = useAdminFundings(page);
  return (
    <>
      <AdminPageHeader
        title="Payments"
        subtitle="Money brands have put into campaigns. Waiting rows are checkouts that were started but not paid."
      />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(result) => (
          <>
            <DataTable
              columns={COLUMNS}
              rows={result.items}
              rowKey={(funding) => funding.id}
              emptyTitle="No payments yet"
            />
            <Pager page={result.page} pageSize={result.pageSize} total={result.total} onPage={setPage} />
          </>
        )}
      </AsyncContent>
    </>
  );
}
