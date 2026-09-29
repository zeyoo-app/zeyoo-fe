'use client';

import { useState } from 'react';

import { AsyncContent, Avatar, Badge, Button, Card, Modal, ProgressBar, Textarea, useConfirm } from '@/design-system';
import type { Campaign, Submission } from '@/shared/api';
import { formatCount, formatMoney } from '@/shared/money/money';
import { BackButton } from '@/shared/nav/BackButton';

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

/** The one action the current lifecycle state allows: publish a draft, close a live
 *  campaign. The caller hides it entirely once the campaign is closed. */
function LifecycleAction({
  campaign,
  onClose,
  loading,
}: {
  campaign: Campaign;
  onClose: () => void;
  loading: boolean;
}) {
  const setStatus = useSetCampaignStatus(campaign.id);

  if (campaign.status === 'draft') {
    return (
      <Button size="sm" fullWidth={false} loading={loading} onClick={() => setStatus.mutate('live')}>
        Publish
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="sm" fullWidth={false} loading={loading} onClick={onClose}>
      Close Campaign
    </Button>
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
    ? campaign.budgetSpent.minorUnits / campaign.budget.minorUnits
    : 0;

  return (
    <>
      {/* The lifecycle action belongs to the top bar, opposite the back affordance, and
          disappears once the campaign is closed — there is nothing left to do. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackButton />
        {campaign.status !== 'closed' ? (
          <LifecycleAction campaign={campaign} onClose={closeCampaign} loading={setStatus.isPending} />
        ) : null}
      </div>

      <CampaignCover platform={campaign.platform} className="mb-5 h-40 rounded-2xl" />

      <div>
        <h1 className="font-display text-2xl font-semibold text-text">{campaign.title}</h1>
        <p className="mt-0.5 text-text-muted">{campaign.brandName}</p>
      </div>

      <Card className="mt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Budget spent</p>
          <p className="text-xs text-text-tertiary">{campaign.submissionCount} submissions</p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-numeric text-2xl leading-none text-green-text">
            {formatMoney(campaign.budgetSpent)}
          </span>
          <span className="font-numeric text-sm text-text-muted">/ {formatMoney(campaign.budget)}</span>
        </div>
        <ProgressBar value={spentRatio} tone={spentRatio > 0.9 ? 'warning' : 'accent'} label="Budget spent" />
      </Card>

      {campaign.status === 'closed' ? (
        <Card className="mt-5">
          <p className="text-sm text-text-muted">This campaign is closed.</p>
        </Card>
      ) : null}

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
