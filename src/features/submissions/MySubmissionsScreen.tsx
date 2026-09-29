'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AsyncContent, Badge, Button, Card, EmptyState, Modal, PageHeader, Textarea } from '@/design-system';
import type { CreatorSubmission } from '@/shared/api';
import { formatCount, formatMoney } from '@/shared/money/money';

import { useMySubmissions, useOpenDispute } from './hooks';

const STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;

export function MySubmissionsScreen() {
  const query = useMySubmissions();

  return (
    <>
      <PageHeader title="My submissions" subtitle="Track status, earnings, and payout holds." />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(submissions) =>
          submissions.length === 0 ? (
            <EmptyState
              spacious
              icon="📋"
              title="No submissions yet"
              description="Submit content for a campaign and its status will show up here."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {submissions.map((submission) => (
                <SubmissionRow key={submission.id} submission={submission} />
              ))}
            </div>
          )
        }
      </AsyncContent>
    </>
  );
}

function SubmissionRow({ submission }: { submission: CreatorSubmission }) {
  const router = useRouter();
  const dispute = useOpenDispute();
  const [appealing, setAppealing] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-text">{submission.campaignTitle}</p>
          <p className="text-xs text-text-muted">{submission.brandName}</p>
        </div>
        <Badge tone={STATUS_TONE[submission.status]}>{submission.status}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm">
        <span className="font-numeric text-text">{formatCount(submission.views)} views</span>
        <span className="font-numeric text-text">{formatMoney(submission.earning)}</span>
      </div>

      {submission.onHold ? (
        <p className="mt-2 text-xs text-warning">Payout on hold — {submission.holdReason}.</p>
      ) : null}
      {submission.rejectionReason ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-danger">{submission.rejectionReason}</p>
          <Button size="sm" variant="secondary" fullWidth={false} onClick={() => setAppealing(true)}>
            Appeal
          </Button>
        </div>
      ) : null}

      <Modal open={appealing} onClose={() => setAppealing(false)} title="Appeal this decision">
        <p className="text-sm text-text-muted">Explain why this submission should be reconsidered.</p>
        <Textarea placeholder="Your appeal" value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button
          disabled={reason.trim().length < 3 || dispute.isPending}
          loading={dispute.isPending}
          onClick={() =>
            dispute.mutate(
              { submissionId: submission.id, reason: reason.trim() },
              // Disputes and appeals live on one screen, so the appeal lands
              // the creator there to watch its status — the only way in.
              { onSuccess: () => router.replace('/creator/disputes') },
            )
          }
        >
          Submit appeal
        </Button>
      </Modal>
    </Card>
  );
}
