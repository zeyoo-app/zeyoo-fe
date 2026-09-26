'use client';

import { useState } from 'react';

import { AsyncContent, Avatar, Badge, Button, Card, Modal, Textarea, useConfirm } from '@/design-system';
import type { Campaign, Submission } from '@/shared/api';
import { formatCount, formatMoney } from '@/shared/money/money';

import { CampaignCover } from './CampaignCover';
import { useCampaign, useSetCampaignStatus } from './hooks';
import { useCampaignSubmissions, useReviewSubmission } from '../submissions/hooks';

export function CampaignDetailBrandScreen({ campaignId }: { campaignId: string }) {
  const campaignQuery = useCampaign(campaignId);

  return (
    <AsyncContent isLoading={campaignQuery.isLoading} isError={campaignQuery.isError} data={campaignQuery.data}>
      {(campaign) => <CampaignDetail campaign={campaign} />}
    </AsyncContent>
  );
}

function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const submissionsQuery = useCampaignSubmissions(campaign.id);
  const setStatus = useSetCampaignStatus(campaign.id);
  const confirm = useConfirm();

  const closeCampaign = async () => {
    const confirmed = await confirm({
      title: 'Close this campaign?',
      message: 'Creators will no longer be able to submit to it. This cannot be undone.',
      confirmLabel: 'Close campaign',
      tone: 'danger',
    });
    if (confirmed) setStatus.mutate('closed');
  };

  const spentRatio = campaign.budget.minorUnits
    ? Math.min(1, campaign.budgetSpent.minorUnits / campaign.budget.minorUnits)
    : 0;

  return (
    <>
      <CampaignCover platform={campaign.platform} className="mb-5 h-40 rounded-2xl" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">{campaign.title}</h1>
          <p className="mt-0.5 text-text-muted">{campaign.brandName}</p>
        </div>
        {campaign.status === 'live' ? (
          <Button
            variant="secondary"
            fullWidth={false}
            size="sm"
            loading={setStatus.isPending}
            onClick={closeCampaign}
          >
            Close campaign
          </Button>
        ) : (
          <Badge tone="neutral">Closed</Badge>
        )}
      </div>

      <Card className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Budget spent</span>
          <span className="font-numeric text-text">
            {formatMoney(campaign.budgetSpent)} / {formatMoney(campaign.budget)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised">
          <div className="h-full rounded-full bg-primary" style={{ width: `${spentRatio * 100}%` }} />
        </div>
      </Card>

      <p className="mt-5 text-sm leading-relaxed text-text-muted">{campaign.brief}</p>

      <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-text">
        Submissions{submissionsQuery.data ? ` (${submissionsQuery.data.length})` : ''}
      </h2>
      <AsyncContent isLoading={submissionsQuery.isLoading} isError={submissionsQuery.isError} data={submissionsQuery.data}>
        {(submissions) => (
          <div className="flex flex-col gap-3">
            {submissions.map((submission) => (
              <SubmissionRow key={submission.id} submission={submission} campaignId={campaign.id} />
            ))}
          </div>
        )}
      </AsyncContent>
    </>
  );
}

const STATUS_TONE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
} as const;

function SubmissionRow({ submission, campaignId }: { submission: Submission; campaignId: string }) {
  const review = useReviewSubmission(campaignId);
  const confirm = useConfirm();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const approve = async () => {
    const confirmed = await confirm({
      title: 'Approve this submission?',
      message: `${submission.creatorHandle} will be paid for their verified views on this post.`,
      confirmLabel: 'Approve',
    });
    if (confirmed) review.mutate({ submissionId: submission.id, decision: 'approve' });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Avatar name={submission.creatorHandle} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{submission.creatorHandle}</p>
          <p className="truncate text-xs text-text-muted">{submission.postUrl}</p>
        </div>
        <Badge tone={STATUS_TONE[submission.status]}>{submission.status}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-text-muted">
        <span className="font-numeric text-text">{formatCount(submission.views)} views</span>
        <span className="font-numeric text-text">{formatMoney(submission.earning)}</span>
      </div>

      {submission.status === 'pending' ? (
        <div className="mt-3 flex gap-2">
          <Button size="sm" fullWidth={false} loading={review.isPending} onClick={approve}>
            Approve
          </Button>
          <Button size="sm" variant="secondary" fullWidth={false} onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </div>
      ) : null}

      {submission.rejectionReason ? (
        <p className="mt-2 text-xs text-danger">{submission.rejectionReason}</p>
      ) : null}

      <Modal open={rejecting} onClose={() => setRejecting(false)} title="Reject submission">
        <p className="text-sm text-text-muted">Tell {submission.creatorHandle} why this doesn&apos;t fit the brief.</p>
        <Textarea placeholder="Reason for rejection" value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button
          variant="danger"
          disabled={reason.trim().length < 3}
          onClick={() => {
            review.mutate({ submissionId: submission.id, decision: 'reject', reason: reason.trim() });
            setRejecting(false);
          }}
        >
          Reject submission
        </Button>
      </Modal>
    </Card>
  );
}
