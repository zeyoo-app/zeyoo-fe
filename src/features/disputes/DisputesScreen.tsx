'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AsyncContent, Badge, Button, Card, EmptyState, Modal, PageHeader, Textarea } from '@/design-system';
import type { Dispute } from '@/shared/api';
import { useDisputes, useOpenDispute } from '@/shared/disputes/hooks';
import { disputeStatusPresentation, disputeSubjectLabel } from '@/shared/disputes/presentation';

export function DisputesScreen() {
  const query = useDisputes();
  const router = useRouter();
  const openDispute = useOpenDispute();
  const [logging, setLogging] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <>
      <PageHeader
        title="Disputes"
        subtitle="Appeals and problems you have raised, and where each one stands."
      />
      <div className="mb-4">
        <Button fullWidth={false} onClick={() => setLogging(true)}>
          Log a dispute
        </Button>
      </div>
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

      <Modal open={logging} onClose={() => setLogging(false)} title="Log a dispute">
        <p className="text-sm text-text-muted">
          Describe the problem and support will reply in the dispute thread. To appeal a rejected
          submission, use Appeal on that submission so it is linked to it.
        </p>
        <Textarea placeholder="What happened?" value={reason} onChange={(event) => setReason(event.target.value)} />
        {openDispute.error ? (
          <p className="text-xs text-danger">
            {openDispute.error instanceof Error ? openDispute.error.message : 'Could not open the dispute.'}
          </p>
        ) : null}
        <Button
          disabled={reason.trim().length < 5}
          loading={openDispute.isPending}
          onClick={() =>
            openDispute.mutate(
              { subjectType: 'other', reason: reason.trim() },
              {
                onSuccess: (dispute) => {
                  setLogging(false);
                  setReason('');
                  router.push(`/disputes/${dispute.id}`);
                },
              },
            )
          }
        >
          Send to support
        </Button>
      </Modal>
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
