'use client';

import { useState } from 'react';

import { AsyncContent } from '@/design-system';
import type { AdminOrganization } from '@/shared/api';

import { AdminPageHeader, DataTable, Pager, type Column } from './DataTable';
import { formatDate, formatTotals } from './format';
import { useAdminOrganizations } from './hooks';

const COLUMNS: Column<AdminOrganization>[] = [
  {
    header: 'Organization',
    cell: (org) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{org.name}</p>
        <p className="truncate text-xs text-text-muted">{org.industry ?? org.website ?? '—'}</p>
      </div>
    ),
  },
  { header: 'Owner', cell: (org) => org.ownerEmail ?? '—' },
  { header: 'Members', cell: (org) => org.memberCount },
  { header: 'Campaigns', cell: (org) => org.campaignCount },
  { header: 'Funded', cell: (org) => formatTotals(org.funded) },
  { header: 'Created', cell: (org) => formatDate(org.createdAt) },
];

export function AdminOrganizationsScreen() {
  const [page, setPage] = useState(1);
  const query = useAdminOrganizations(page);
  return (
    <>
      <AdminPageHeader
        title="Organizations"
        subtitle="Brands on the platform, who owns them, and how much they have funded."
      />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(result) => (
          <>
            <DataTable
              columns={COLUMNS}
              rows={result.items}
              rowKey={(org) => org.id}
              emptyTitle="No organizations yet"
            />
            <Pager page={result.page} pageSize={result.pageSize} total={result.total} onPage={setPage} />
          </>
        )}
      </AsyncContent>
    </>
  );
}
