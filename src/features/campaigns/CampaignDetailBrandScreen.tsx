'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  AsyncContent,
  Avatar,
  Badge,
  Button,
  Card,
  ChoiceChips,
  Field,
  Modal,
  ProgressBar,
  Textarea,
  useConfirm,
  type Choice,
} from '@/design-system';
import type { Campaign, FraudCase, RiskLevel, Submission } from '@/shared/api';
import { formatCount, formatMoney } from '@/shared/money/money';
import { BackButton } from '@/shared/nav/BackButton';

import { CampaignCover } from './CampaignCover';
import { useOpenDispute } from '@/shared/disputes/hooks';
import {
  useCampaign,
  useCampaignFraudCases,
  useCloseFraudCase,
  useFlagCreator,
  useSetCampaignStatus,
} from './hooks';
import { useCampaignSubmissions, useReviewSubmission, useTrackViews } from '../submissions/hooks';

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
  const router = useRouter();
  const submissionsQuery = useCampaignSubmissions(campaign.id);
  const setStatus = useSetCampaignStatus(campaign.id);
  const confirm = useConfirm();
  const fraudCases = useCampaignFraudCases(campaign.id);
  const closeCase = useCloseFraudCase(campaign.id);
  const openDispute = useOpenDispute();
  const [reporting, setReporting] = useState(false);
  const [problem, setProblem] = useState('');

  const closeCampaign = async () => {
    const confirmed = await confirm({
      title: 'Close this campaign?',
      message: 'Creators will no longer be able to submit to it. This cannot be undone.',
      confirmLabel: 'Close campaign',
      tone: 'danger',
    });
    if (confirmed) setStatus.mutate('closed');
  };

  const spentMinor = (submissionsQuery.data ?? []).reduce((total, item) => total + item.earning.minorUnits, 0);
  const spent = { ...campaign.budgetSpent, minorUnits: spentMinor };
  const spentRatio = campaign.budget.minorUnits ? spent.minorUnits / campaign.budget.minorUnits : 0;

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
            {formatMoney(spent)}
          </span>
          <span className="font-numeric text-sm text-text-muted">/ {formatMoney(campaign.budget)}</span>
        </div>
        <ProgressBar value={spentRatio} tone={spentRatio > 0.9 ? 'warning' : 'accent'} label="Budget spent" />
      </Card>

      {campaign.status === 'live' ? (
        <div className="mt-4">
          <Button
            variant="secondary"
            fullWidth={false}
            onClick={() => router.push(`/brand/creators?campaign=${campaign.id}`)}
          >
            Invite creators
          </Button>
        </div>
      ) : null}

      <div className="mt-3">
        <Button
          variant="secondary"
          fullWidth={false}
          onClick={() => router.push(`/brand/campaigns/${campaign.id}/report`)}
        >
          View report
        </Button>
      </div>

      {campaign.status === 'closed' ? (
        <Card className="mt-5">
          <p className="text-sm text-text-muted">This campaign is closed.</p>
        </Card>
      ) : null}

      <p className="mt-5 text-sm leading-relaxed text-text-muted">{campaign.brief}</p>

      <EarningsReviews
        cases={fraudCases.data ?? []}
        isBusy={closeCase.isPending}
        onClose={(caseId, action) => closeCase.mutate({ caseId, action })}
      />

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

      <div className="mt-8">
        <Button variant="ghost" fullWidth={false} onClick={() => setReporting(true)}>
          Report a problem with this campaign
        </Button>
      </div>
      <Modal open={reporting} onClose={() => setReporting(false)} title="Report a problem">
        <p className="text-sm text-text-muted">
          Tell support what went wrong. They will reply in the dispute thread.
        </p>
        <Textarea
          placeholder="What happened?"
          value={problem}
          onChange={(event) => setProblem(event.target.value)}
        />
        {openDispute.error ? (
          <p className="text-xs text-danger">
            {openDispute.error instanceof Error ? openDispute.error.message : 'Could not open the dispute.'}
          </p>
        ) : null}
        <Button
          disabled={problem.trim().length < 5}
          loading={openDispute.isPending}
          onClick={() =>
            openDispute.mutate(
              { subjectType: 'campaign', subjectId: campaign.id, reason: problem.trim() },
              { onSuccess: (created) => router.push(`/disputes/${created.id}`) },
            )
          }
        >
          Send to support
        </Button>
      </Modal>
    </>
  );
}

const LEVELS: Choice<RiskLevel>[] = [
  { value: 'low', label: 'Low concern' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const LEVEL_TONE = { low: 'neutral', medium: 'warning', high: 'danger' } as const;

const CASE_STATUS: Record<FraudCase['status'], { label: string; hint: string }> = {
  open: { label: 'Earnings paused', hint: 'Waiting on you or Zeyoo support to decide.' },
  confirmed: { label: 'Problem confirmed', hint: 'No further earnings on this campaign.' },
  cleared: { label: 'Cleared', hint: 'Earnings resumed.' },
};

function EarningsReviews({
  cases,
  isBusy,
  onClose,
}: {
  cases: FraudCase[];
  isBusy: boolean;
  onClose: (caseId: string, action: 'confirm' | 'clear') => void;
}) {
  if (cases.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-semibold text-text">
        Earnings reviews ({cases.length})
      </h2>
      <div className="flex flex-col gap-3">
        {cases.map((item) => (
          <Card key={item.id} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-text">{item.creatorName}</p>
              <Badge tone={LEVEL_TONE[item.level]}>{item.level} concern</Badge>
            </div>
            <p className="text-sm text-text-muted">
              {CASE_STATUS[item.status].label}. {CASE_STATUS[item.status].hint}
            </p>
            {item.note ? <p className="text-xs text-text-muted">Your note: {item.note}</p> : null}
            {item.status === 'open' ? (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" fullWidth={false} disabled={isBusy} onClick={() => onClose(item.id, 'clear')}>
                  Clear and resume
                </Button>
                <Button size="sm" variant="danger" fullWidth={false} disabled={isBusy} onClick={() => onClose(item.id, 'confirm')}>
                  Confirm problem
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
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
  const fraudCases = useCampaignFraudCases(campaignId);
  const flag = useFlagCreator(campaignId);
  const closeCase = useCloseFraudCase(campaignId);
  const [flagging, setFlagging] = useState(false);
  const [flagLevel, setFlagLevel] = useState<RiskLevel>('medium');
  const [flagNote, setFlagNote] = useState('');
  const openCase = (fraudCases.data ?? []).find(
    (item) => item.creatorId === submission.creatorId && item.status === 'open',
  );
  const track = useTrackViews(campaignId);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [enteringViews, setEnteringViews] = useState(false);
  const [viewsDraft, setViewsDraft] = useState('');
  const [trackingNotice, setTrackingNotice] = useState<string | null>(null);

  const viewsToRecord = Number(viewsDraft.replace(/[^0-9]/g, ''));
  const viewsValid = viewsDraft.trim().length > 0 && Number.isSafeInteger(viewsToRecord);

  const trackViews = async (views?: number) => {
    setTrackingNotice(null);
    try {
      const outcome = await track.mutateAsync({ submissionId: submission.id, views });
      setTrackingNotice(
        outcome.status === 'recorded'
          ? 'Views updated.'
          : `${outcome.message} Use "Enter views" instead.`,
      );
    } catch (error) {
      setTrackingNotice(error instanceof Error ? error.message : 'Could not update views.');
    }
  };

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
        <Avatar name={submission.creatorName ?? submission.creatorHandle} src={submission.creatorAvatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{submission.creatorName ?? submission.creatorHandle}</p>
          <p className="truncate text-xs text-text-muted">
            {submission.creatorHandle}
            {submission.accountVerified ? ' · Verified account' : ' · Unverified account'}
          </p>
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

      {submission.status === 'approved' ? (
        <div className="mt-3 flex gap-2">
          <Button size="sm" fullWidth={false} loading={track.isPending} onClick={() => trackViews()}>
            Sync views
          </Button>
          <Button
            size="sm"
            variant="secondary"
            fullWidth={false}
            onClick={() => {
              setViewsDraft(submission.views > 0 ? String(submission.views) : '');
              setEnteringViews(true);
            }}
          >
            Enter views
          </Button>
        </div>
      ) : null}
      {trackingNotice ? <p className="mt-2 text-xs text-text-muted">{trackingNotice}</p> : null}

      {submission.status === 'approved' && submission.earningsPaused ? (
        <div className="mt-3 flex flex-col items-start gap-2">
          <p className="text-xs text-warning">
            Earnings paused. This creator earns nothing more here until you clear the flag.
          </p>
          {openCase ? (
            <Button
              size="sm"
              variant="secondary"
              fullWidth={false}
              loading={closeCase.isPending}
              onClick={() => closeCase.mutate({ caseId: openCase.id, action: 'clear' })}
            >
              Clear flag and resume
            </Button>
          ) : null}
        </div>
      ) : null}

      {submission.status === 'approved' && !submission.earningsPaused ? (
        <div className="mt-3 flex flex-col items-start gap-2">
          {submission.risk === 'high' || submission.risk === 'medium' ? (
            <p className="text-xs text-warning">
              {submission.risk === 'high'
                ? 'Engagement looks unusual: more likes, comments and shares than views.'
                : 'Engagement looks unusual: interactions but no recorded views.'}
            </p>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            fullWidth={false}
            onClick={() => {
              setFlagLevel(submission.risk === 'high' ? 'high' : 'medium');
              setFlagNote('');
              setFlagging(true);
            }}
          >
            Flag creator
          </Button>
        </div>
      ) : null}

      <Modal open={flagging} onClose={() => setFlagging(false)} title="Flag for review">
        <p className="text-sm text-text-muted">
          {submission.creatorName ?? submission.creatorHandle} will stop earning on this campaign right
          away and be told why. Earnings already paid stay paid. You can clear the flag at any time and
          earning resumes.
        </p>
        <ChoiceChips
          accessibilityLabel="How serious is the concern"
          choices={LEVELS}
          value={flagLevel}
          onChange={setFlagLevel}
        />
        <Textarea
          placeholder="What looks wrong? (shown to the creator)"
          value={flagNote}
          onChange={(event) => setFlagNote(event.target.value)}
        />
        {flag.error ? (
          <p className="text-xs text-danger">
            {flag.error instanceof Error ? flag.error.message : 'Could not flag this creator.'}
          </p>
        ) : null}
        <Button
          variant="danger"
          disabled={flagNote.trim().length < 5}
          loading={flag.isPending}
          onClick={() =>
            flag.mutate(
              { creatorId: submission.creatorId, level: flagLevel, note: flagNote.trim() },
              { onSuccess: () => setFlagging(false) },
            )
          }
        >
          Pause earnings and flag
        </Button>
      </Modal>

      {submission.rejectionReason ? (
        <p className="mt-2 text-xs text-danger">{submission.rejectionReason}</p>
      ) : null}

      <Modal open={enteringViews} onClose={() => setEnteringViews(false)} title="Enter views">
        <p className="text-sm text-text-muted">
          The total views {submission.creatorHandle}&apos;s post has right now. Earnings are credited for any increase.
        </p>
        <Field
          label="Total views"
          inputMode="numeric"
          placeholder="e.g. 12500"
          value={viewsDraft}
          onChange={(event) => setViewsDraft(event.target.value)}
        />
        <Button
          disabled={!viewsValid}
          onClick={() => {
            void trackViews(viewsToRecord);
            setEnteringViews(false);
          }}
        >
          Save views
        </Button>
      </Modal>

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
