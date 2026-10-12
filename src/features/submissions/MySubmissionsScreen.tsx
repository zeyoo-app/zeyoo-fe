'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AsyncContent, Badge, Button, Card, EmptyState, Modal, PageHeader, Textarea } from '@/design-system';
import type { CreatorSubmission } from '@/shared/api';
import { formatCount, formatMoney } from '@/shared/money/money';

import { useOpenDispute } from '@/shared/disputes/hooks';
import { useMyFraudCases } from '@/shared/fraud/hooks';
import { useMySubmissions } from './hooks';

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
  const fraudCases = useMyFraudCases();
  const openReview = (fraudCases.data ?? []).find(
    (item) => item.campaignId === submission.campaignId && item.status === 'open',
  );
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

      {submission.earningsPaused ? (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-xs text-warning">
            Earnings paused. The brand has this campaign under review, so new views are not being
            added to your earnings. What you already earned is safe.
            {openReview?.note ? ` Brand's note: ${openReview.note}` : ''}
          </p>
          {openReview ? (
            <Button
              size="sm"
              variant="secondary"
              fullWidth={false}
              loading={dispute.isPending}
              onClick={() =>
                dispute.mutate(
                  {
                    subjectType: 'fraud_case',
                    subjectId: openReview.id,
                    reason: `I disagree with the review on "${submission.campaignTitle}".`,
                  },
                  { onSuccess: (created) => router.push(`/disputes/${created.id}`) },
                )
              }
            >
              Dispute this review
            </Button>
          ) : null}
        </div>
      ) : null}
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
        <p className="text-sm text-text-muted">
          Explain why this submission met the brief. Zeyoo support reviews it and replies in the
          dispute thread. If it is upheld, your submission is approved.
        </p>
        <Textarea placeholder="Your appeal" value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button
          disabled={reason.trim().length < 3 || dispute.isPending}
          loading={dispute.isPending}
          onClick={() =>
            dispute.mutate(
              { subjectType: 'submission', subjectId: submission.id, reason: reason.trim() },
              { onSuccess: (created) => router.replace(`/disputes/${created.id}`) },
            )
          }
        >
          Submit appeal
        </Button>
      </Modal>
    </Card>
  );
}
