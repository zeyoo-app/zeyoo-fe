'use client';

import { useState } from 'react';

import { AsyncContent, Badge, Button, Card, EmptyState, PageHeader, ProgressBar, StatCard } from '@/design-system';
import { useApi } from '@/shared/api';
import { formatCount, formatMoney } from '@/shared/money/money';
import { BackButton } from '@/shared/nav/BackButton';

import { useCampaignReport } from './hooks';

export function CampaignReportScreen({ campaignId }: { campaignId: string }) {
  const query = useCampaignReport(campaignId);
  const api = useApi();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  /** Downloads the summary as a CSV file (contract §1.2). */
  async function download(title: string) {
    setExporting(true);
    setExportError(null);
    try {
      const csv = await api.getCampaignReportCsv(campaignId);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
      link.href = url;
      link.download = `zeyoo-report-${slug || 'campaign'}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Could not export the report.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <BackButton />
      </div>
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(report) => (
          <>
            <PageHeader
              title={report.title}
              subtitle="Campaign report"
              action={
                <Button variant="secondary" fullWidth={false} loading={exporting} onClick={() => void download(report.title)}>
                  Download CSV
                </Button>
              }
            />
            {exportError ? <p className="mb-3 text-xs text-danger">{exportError}</p> : null}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total views" value={formatCount(report.totalViews)} />
              <StatCard label="Paid to creators" value={formatMoney(report.spent)} />
              <StatCard
                label="Cost per 1,000 views"
                value={report.costPerThousandViews ? formatMoney(report.costPerThousandViews) : '—'}
              />
              <StatCard
                label="Approved creators"
                value={`${report.submissions.approved} of ${report.applications.approved}`}
              />
            </div>

            <Card className="mt-4 flex flex-col gap-2 p-4">
              <p className="text-sm font-medium text-text">Budget</p>
              <ProgressBar
                value={report.budget.minorUnits ? report.spent.minorUnits / report.budget.minorUnits : 0}
                label="Budget paid out"
              />
              <p className="text-xs text-text-muted">
                {formatMoney(report.spent)} paid of {formatMoney(report.budget)} budget ·{' '}
                {formatMoney(report.funded)} funded so far
              </p>
            </Card>

            <Card className="mt-3 flex flex-col gap-1 p-4">
              <p className="text-sm font-medium text-text">Funnel</p>
              <p className="text-sm text-text-muted">
                {report.applications.total} applications · {report.applications.approved} approved ·{' '}
                {report.submissions.total} submissions · {report.submissions.approved} approved
              </p>
            </Card>

            <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-text">Top creators</h2>
            {report.topCreators.length === 0 ? (
              <EmptyState
                title="No views recorded yet"
                description="Sync or enter views on approved submissions and creators will appear here."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {report.topCreators.map((creator) => (
                  <Card key={creator.creatorId} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-medium text-text">{creator.name}</p>
                      <p className="text-xs text-text-muted">
                        {formatCount(creator.views)} views · {formatMoney(creator.earned)} earned
                      </p>
                    </div>
                    {creator.paused ? <Badge tone="warning">Paused</Badge> : null}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </AsyncContent>
    </>
  );
}
