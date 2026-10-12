'use client';

import Link from 'next/link';

import { AsyncContent, Badge, Card, EmptyState, PageHeader } from '@/design-system';
import type { Dispute } from '@/shared/api';
import { useDisputes } from '@/shared/disputes/hooks';
import { disputeStatusPresentation, disputeSubjectLabel } from '@/shared/disputes/presentation';

export function DisputesScreen() {
  const query = useDisputes();

  return (
    <>
      <PageHeader
        title="Disputes"
        subtitle="Appeals and problems you have raised, and where each one stands."
      />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(disputes) =>
          disputes.length === 0 ? (
            <EmptyState
              title="No disputes"
              description="If a submission is rejected unfairly or something goes wrong, you can open a dispute and it will appear here."
            />
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
  const status = disputeStatusPresentation(dispute.status);
  const last = dispute.events[dispute.events.length - 1];

  return (
    <Link href={`/disputes/${dispute.id}`} className="block">
      <Card className="flex flex-col gap-2 p-4 transition-colors hover:bg-surface-hover">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-text-tertiary">
              {disputeSubjectLabel(dispute.subjectType)}
            </p>
            <p className="truncate font-medium text-text">{dispute.title}</p>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <p className="line-clamp-2 text-sm text-text-muted">{last?.message ?? dispute.reason}</p>
        <p className="text-xs text-text-tertiary">
          Opened {new Date(dispute.createdAt).toLocaleDateString()}
        </p>
      </Card>
    </Link>
  );
}
