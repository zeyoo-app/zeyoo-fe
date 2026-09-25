'use client';

import { useQuery } from '@tanstack/react-query';

import { AsyncContent, Badge, Card, EmptyState, PageHeader } from '@/design-system';
import { queryKeys, useApi } from '@/shared/api';
import type { Dispute } from '@/shared/api';

const STATUS_TONE = { open: 'warning', in_review: 'accent', resolved: 'success' } as const;
const STATUS_LABEL = { open: 'Open', in_review: 'In review', resolved: 'Resolved' } as const;

export function DisputesScreen() {
  const api = useApi();
  const query = useQuery({ queryKey: queryKeys.disputes, queryFn: () => api.getDisputes() });

  return (
    <>
      <PageHeader title="Disputes" subtitle="Appeals are usually reviewed within 3 business days." />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(disputes) =>
          disputes.length === 0 ? (
            <EmptyState title="No disputes" description="Appeals you open will appear here." />
          ) : (
            <div className="flex flex-col gap-3">
              {disputes.map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} />
              ))}
            </div>
          )
        }
      </AsyncContent>
    </>
  );
}

function DisputeCard({ dispute }: { dispute: Dispute }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-text">{dispute.campaignTitle}</p>
          <p className="mt-0.5 text-xs text-text-muted">{dispute.reason}</p>
        </div>
        <Badge tone={STATUS_TONE[dispute.status]}>{STATUS_LABEL[dispute.status]}</Badge>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
        {dispute.events.map((event) => (
          <div key={event.id}>
            <p className="text-xs font-medium text-text">{event.author}</p>
            <p className="text-sm text-text-muted">{event.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
