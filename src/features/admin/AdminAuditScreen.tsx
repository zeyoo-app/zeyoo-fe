'use client';

import { useState } from 'react';

import { AsyncContent } from '@/design-system';
import type { AdminAuditEntry } from '@/shared/api';

import { AdminPageHeader, DataTable, Pager, type Column } from './DataTable';
import { formatDateTime } from './format';
import { useAdminAuditLog } from './hooks';

const ACTIONS: { match: RegExp; label: string }[] = [
  { match: /\/users\/:userId\/suspend$/, label: 'Suspended an account' },
  { match: /\/users\/:userId\/reactivate$/, label: 'Reactivated an account' },
  { match: /\/campaigns\/:campaignId\/close$/, label: 'Closed a campaign' },
  {
    match: /\/withdrawals\/:withdrawalId\/approve$/,
    label: 'Approved and paid a withdrawal',
  },
  {
    match: /\/withdrawals\/:withdrawalId\/reject$/,
    label: 'Rejected a withdrawal',
  },
  {
    match: /\/withdrawals\/:withdrawalId\/hold$/,
    label: 'Put a withdrawal on hold',
  },
  {
    match: /\/withdrawals\/:withdrawalId\/release$/,
    label: 'Released a withdrawal hold',
  },
  {
    match: /\/disputes\/:disputeId\/review$/,
    label: 'Took a dispute into review',
  },
  { match: /\/disputes\/:disputeId\/decision$/, label: 'Decided a dispute' },
  {
    match: /\/fraud-cases\/:caseId\/confirm$/,
    label: 'Confirmed an earnings review',
  },
  {
    match: /\/fraud-cases\/:caseId\/clear$/,
    label: 'Cleared an earnings review',
  },
  { match: /\/campaigns\/:campaignId\/refund$/, label: 'Refunded unspent campaign budget' },
  { match: /\/verifications\/:userId\/approve$/, label: 'Verified a creator' },
  { match: /\/verifications\/:userId\/reject$/, label: 'Rejected a verification request' },
  { match: /\/staff$/, label: 'Gave someone staff access' },
  { match: /\/staff\/:userId\/deactivate$/, label: 'Removed staff access' },
  { match: /\/staff\/:userId\/reactivate$/, label: 'Restored staff access' },
  { match: /\/campaign-categories$/, label: 'Added a category' },
];

function describe(entry: AdminAuditEntry): string {
  return ACTIONS.find((action) => action.match.test(entry.route))?.label ?? `${entry.method} ${entry.route}`;
}

function detail(entry: AdminAuditEntry): string {
  const parts: string[] = [];
  const outcome = entry.body?.outcome;
  if (typeof outcome === 'string') parts.push(outcome.toLowerCase());
  const reason = entry.body?.reason ?? entry.body?.note ?? entry.body?.name;
  if (typeof reason === 'string') parts.push(`"${reason}"`);
  const target = entry.params ? Object.values(entry.params)[0] : undefined;
  if (target) parts.push(`#${target.slice(0, 8)}`);
  return parts.join(' · ') || '—';
}

const COLUMNS: Column<AdminAuditEntry>[] = [
  { header: 'When', cell: (entry) => formatDateTime(entry.createdAt) },
  { header: 'Who', cell: (entry) => entry.adminEmail ?? 'Unknown' },
  { header: 'Action', cell: (entry) => describe(entry) },
  {
    header: 'Details',
    cell: (entry) => <span className="text-text-muted">{detail(entry)}</span>,
  },
];

export function AdminAuditScreen() {
  const [page, setPage] = useState(1);
  const query = useAdminAuditLog(page);
  return (
    <>
      <AdminPageHeader
        title="Audit log"
        subtitle="Every change staff have made in the console: who did what, and when. Newest first."
      />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(result) => (
          <>
            <DataTable
              columns={COLUMNS}
              rows={result.items}
              rowKey={(entry) => entry.id}
              emptyTitle="No actions recorded yet"
            />
            <Pager page={result.page} pageSize={result.pageSize} total={result.total} onPage={setPage} />
          </>
        )}
      </AsyncContent>
    </>
  );
}
