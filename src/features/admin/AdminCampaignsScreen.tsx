'use client';

import { useState } from 'react';

import {
  AsyncContent,
  Badge,
  Button,
  ChoiceChips,
  Field,
  useConfirm,
  type BadgeTone,
  type Choice,
} from '@/design-system';
import type { AdminCampaign, AdminCampaignStatus } from '@/shared/api';

import { AdminPageHeader, DataTable, Pager, type Column } from './DataTable';
import { formatDate, formatMinor } from './format';
import { useAdminCampaigns, useCloseCampaign, useRefundCampaign } from './hooks';

const STATUS_CHOICES: Choice<AdminCampaignStatus | 'ALL'>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PUBLISHED', label: 'Live' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CLOSED', label: 'Closed' },
];

const STATUS: Record<AdminCampaignStatus, { label: string; tone: BadgeTone }> = {
  PUBLISHED: { label: 'Live', tone: 'success' },
  DRAFT: { label: 'Draft', tone: 'warning' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
};

export function AdminCampaignsScreen() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminCampaignStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const query = useAdminCampaigns({
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    page,
  });
  const close = useCloseCampaign();
  const refund = useRefundCampaign();
  const confirm = useConfirm();

  const forceClose = async (campaign: AdminCampaign) => {
    const confirmed = await confirm({
      title: 'Close this campaign?',
      message: `"${campaign.title}" stops accepting creators and submissions. Earnings already credited are kept. This cannot be undone.`,
      confirmLabel: 'Close campaign',
      tone: 'danger',
    });
    if (confirmed) close.mutate(campaign.id);
  };

  const refundUnspent = async (campaign: AdminCampaign) => {
    const confirmed = await confirm({
      title: `Refund ${formatMinor(campaign.refundableMinor, campaign.currencyCode)}?`,
      message: `The unspent budget of "${campaign.title}" goes back to ${campaign.organizationName}'s card through Stripe. Creators keep what they have already earned. This cannot be undone.`,
      confirmLabel: 'Refund unspent budget',
      tone: 'danger',
    });
    if (confirmed) refund.mutate(campaign.id);
  };

  const columns: Column<AdminCampaign>[] = [
    {
      header: 'Campaign',
      cell: (campaign) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{campaign.title}</p>
          <p className="truncate text-xs text-text-muted">{campaign.organizationName}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (campaign) => <Badge tone={STATUS[campaign.status].tone}>{STATUS[campaign.status].label}</Badge>,
    },
    {
      header: 'Budget',
      cell: (campaign) => formatMinor(campaign.budgetMinor, campaign.currencyCode),
    },
    {
      header: 'Funded',
      cell: (campaign) => formatMinor(campaign.fundedMinor, campaign.currencyCode),
    },
    {
      header: 'Paid to creators',
      cell: (campaign) => formatMinor(campaign.paidToCreatorsMinor, campaign.currencyCode),
    },
    { header: 'Refunded', cell: (campaign) => formatMinor(campaign.refundedMinor, campaign.currencyCode) },
    { header: 'Submissions', cell: (campaign) => campaign.submissionCount },
    { header: 'Created', cell: (campaign) => formatDate(campaign.createdAt) },
    {
      header: '',
      className: 'text-end',
      cell: (campaign) =>
        campaign.status === 'PUBLISHED' ? (
          <Button
            size="sm"
            variant="danger"
            fullWidth={false}
            loading={close.isPending && close.variables === campaign.id}
            onClick={() => forceClose(campaign)}
          >
            Close
          </Button>
        ) : campaign.refundableMinor > 0 ? (
          <Button
            size="sm"
            variant="secondary"
            fullWidth={false}
            loading={refund.isPending && refund.variables === campaign.id}
            onClick={() => refundUnspent(campaign)}
          >
            Refund {formatMinor(campaign.refundableMinor, campaign.currencyCode)}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Campaigns"
        subtitle="Every campaign across brands. Closing a live campaign stops new work; earnings already credited stay."
      />
      <div className="mb-4 flex flex-col gap-3">
        <Field
          label="Search"
          placeholder="Campaign title"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <ChoiceChips
          accessibilityLabel="Status"
          choices={STATUS_CHOICES}
          value={status}
          onChange={setStatus}
        />
      </div>
      {close.error || refund.error ? (
        <p className="mb-3 text-sm text-danger">
          {((close.error ?? refund.error) as Error).message ?? 'That action could not be completed.'}
        </p>
      ) : null}
      {refund.data ? (
        <p className="mb-3 text-sm text-green-text">
          Refunded {formatMinor(refund.data.refundedMinor, refund.data.currencyCode)} to the brand.
        </p>
      ) : null}
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(result) => (
          <>
            <DataTable
              columns={columns}
              rows={result.items}
              rowKey={(campaign) => campaign.id}
              emptyTitle="No campaigns match"
            />
            <Pager page={result.page} pageSize={result.pageSize} total={result.total} onPage={setPage} />
          </>
        )}
      </AsyncContent>
    </>
  );
}
