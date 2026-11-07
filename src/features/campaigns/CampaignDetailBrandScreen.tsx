'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, LifeBuoy, Pencil, UserPlus, XCircle } from 'lucide-react';

import {
  ActionsMenu,
  AsyncContent,
  Avatar,
  Badge,
  Button,
  Card,
  ChoiceChips,
  EmptyState,
  Field,
  Modal,
  ProgressBar,
  TabBar,
  Textarea,
  useConfirm,
  type Choice,
  type MenuAction,
} from '@/design-system';
import type { Campaign, FraudCase, RiskLevel, Submission } from '@/shared/api';
import { formatCampaignReward, formatCount, formatMoney } from '@/shared/money/money';
import { platformsLabel } from '@/shared/format/platform';
import { BackButton } from '@/shared/nav/BackButton';

import { ApplicationsReview, visibleApplications } from './ApplicationsReview';
import { CampaignCover } from './CampaignCover';
import {
  CampaignAboutSection,
  CampaignBriefSection,
  CampaignReferencesSection,
  CampaignRequirementsSection,
  CampaignScheduleSection,
} from './CampaignInfoSections';
import { useOpenDispute } from '@/shared/disputes/hooks';
import {
  useCampaign,
  useCampaignFraudCases,
  useCloseFraudCase,
  useFlagCreator,
  useSetCampaignStatus,
} from './hooks';
import {
  useCampaignApplications,
  useCampaignSubmissions,
  useReviewSubmission,
  useTrackViews,
} from '../submissions/hooks';

export function CampaignDetailBrandScreen({ campaignId }: { campaignId: string }) {
  const campaignQuery = useCampaign(campaignId);

  return (
    <AsyncContent isLoading={campaignQuery.isLoading} isError={campaignQuery.isError} data={campaignQuery.data}>
      {(campaign) => <CampaignDetail campaign={campaign} />}
    </AsyncContent>
  );
}

type CampaignTab = 'overview' | 'applications' | 'submissions';

function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const submissionsQuery = useCampaignSubmissions(campaign.id);
  const applicationsQuery = useCampaignApplications(campaign.id);
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

  const [tab, setTab] = useState<CampaignTab>('overview');
  const pendingApplications = visibleApplications(applicationsQuery.data).filter(
    (application) => application.status === 'pending',
  ).length;
  const pendingSubmissions = (submissionsQuery.data ?? []).filter((submission) => submission.status === 'pending').length;

  const actions: MenuAction[] = [
    ...(campaign.status === 'live'
      ? [
          {
            key: 'invite',
            label: 'Invite creators',
            icon: UserPlus,
            onSelect: () => router.push(`/brand/creators?campaign=${campaign.id}`),
          },
        ]
      : []),
    {
      key: 'report',
      label: 'View report',
      icon: BarChart3,
      onSelect: () => router.push(`/brand/campaigns/${campaign.id}/report`),
    },
    ...(campaign.status !== 'closed'
      ? [
          {
            key: 'edit',
            label: 'Edit campaign',
            icon: Pencil,
            onSelect: () => router.push(`/brand/campaigns/${campaign.id}/edit`),
          },
        ]
      : []),
    // A support ticket about this campaign: a payment, a creator, a submission.
    { key: 'help', label: 'Raise a dispute', icon: LifeBuoy, onSelect: () => setReporting(true) },
    ...(campaign.status === 'live'
      ? [{ key: 'close', label: 'Close campaign', icon: XCircle, destructive: true, onSelect: () => void closeCampaign() }]
      : []),
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <BackButton />
        <div className="flex items-center gap-2">
          {campaign.status === 'draft' ? (
            <Button size="sm" fullWidth={false} loading={setStatus.isPending} onClick={() => setStatus.mutate('live')}>
              Publish
            </Button>
          ) : null}
          <ActionsMenu ariaLabel="Campaign actions" actions={actions} />
        </div>
      </div>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-text">{campaign.title}</h1>
          <p className="mt-0.5 text-text-muted">{campaign.brandName}</p>
        </div>
        {campaign.status === 'live' ? <Badge tone="success">Live</Badge> : null}
      </div>

      <TabBar<CampaignTab>
        ariaLabel="Campaign sections"
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'applications', label: 'Applications', badge: pendingApplications },
          { value: 'submissions', label: 'Submissions', badge: pendingSubmissions },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-5">
        {tab === 'overview' ? (
          <>
            <CampaignCover
              platform={campaign.platform}
              imageUrl={campaign.coverImageUrl}
              className="mb-4 h-48 rounded-2xl"
            />
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge tone="neutral">{platformsLabel(campaign.platforms)}</Badge>
              <Badge tone="success" className="font-numeric">
                {formatCampaignReward(campaign)}
              </Badge>
            </div>

            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Budget spent</p>
                <p className="text-xs text-text-tertiary">{campaign.submissionCount} submissions</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-numeric text-2xl leading-none text-green-text">{formatMoney(spent)}</span>
                <span className="font-numeric text-sm text-text-muted">/ {formatMoney(campaign.budget)}</span>
              </div>
              <ProgressBar value={spentRatio} tone={spentRatio > 0.9 ? 'warning' : 'accent'} label="Budget spent" />
            </Card>

            {campaign.status === 'closed' ? (
              <Card className="mt-4">
                <p className="text-sm text-text-muted">This campaign is closed.</p>
              </Card>
            ) : null}

            <EarningsReviews
              cases={fraudCases.data ?? []}
              isBusy={closeCase.isPending}
              onClose={(caseId, action) => closeCase.mutate({ caseId, action })}
            />
            <CampaignScheduleSection campaign={campaign} />
            <CampaignBriefSection campaign={campaign} />
            <CampaignRequirementsSection campaign={campaign} />
            <CampaignAboutSection campaign={campaign} />
            <CampaignReferencesSection campaign={campaign} />

          </>
        ) : null}

        {tab === 'applications' ? <ApplicationsReview campaignId={campaign.id} /> : null}

        {tab === 'submissions' ? (
          <AsyncContent isLoading={submissionsQuery.isLoading} isError={submissionsQuery.isError} data={submissionsQuery.data}>
            {(submissions) =>
              submissions.length === 0 ? (
                <EmptyState title="No submissions yet" description="They'll appear here as creators post." />
              ) : (
                <div className="flex flex-col gap-3">
                  {submissions.map((submission) => (
                    <SubmissionRow key={submission.id} submission={submission} campaignId={campaign.id} />
                  ))}
                </div>
              )
            }
          </AsyncContent>
        ) : null}
      </div>

      <Modal open={reporting} onClose={() => setReporting(false)} title="Raise a dispute">
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

const STATUS = {
  pending: { tone: 'warning', label: 'Pending' },
  needs_changes: { tone: 'warning', label: 'Changes requested' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
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
  const [rejecting, setRejecting] = useState<'reject' | 'request_changes' | null>(null);
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
          <a
            href={submission.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-xs text-green-text hover:underline"
          >
            {submission.kind === 'upload' ? '▶ Watch uploaded video' : submission.postUrl}
          </a>
        </div>
        <Badge tone={STATUS[submission.status].tone}>{STATUS[submission.status].label}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-text-muted">
        <span className="font-numeric text-text">{formatCount(submission.views)} views</span>
        <span className="font-numeric text-text">{formatMoney(submission.earning)}</span>
      </div>

      {submission.status === 'pending' ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:flex">
          <Button size="sm" className="sm:w-auto" loading={review.isPending} onClick={approve}>
            Approve
          </Button>
          <Button size="sm" variant="secondary" className="sm:w-auto" onClick={() => setRejecting('request_changes')}>
            <span className="sm:hidden">Changes</span>
            <span className="hidden sm:inline">Request changes</span>
          </Button>
          <Button size="sm" variant="secondary" className="sm:w-auto" onClick={() => setRejecting('reject')}>
            Reject
          </Button>
        </div>
      ) : null}
      {submission.status === 'needs_changes' && submission.changeRequest ? (
        <p className="mt-2 text-xs text-text-muted">Waiting for a revision: {submission.changeRequest}</p>
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

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title={rejecting === 'request_changes' ? 'Request changes' : 'Reject submission'}
      >
        <p className="text-sm text-text-muted">
          {rejecting === 'request_changes'
            ? `Tell ${submission.creatorHandle} what to change. They can submit a revised post.`
            : `Tell ${submission.creatorHandle} why this doesn\u2019t fit the brief.`}
        </p>
        <Textarea
          placeholder={rejecting === 'request_changes' ? 'e.g. Add the #ad label and tag @brand' : 'Reason for rejection'}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <Button
          variant={rejecting === 'request_changes' ? 'primary' : 'danger'}
          disabled={reason.trim().length < 3}
          onClick={() => {
            if (!rejecting) return;
            review.mutate({ submissionId: submission.id, decision: rejecting, reason: reason.trim() });
            setRejecting(null);
            setReason('');
          }}
        >
          {rejecting === 'request_changes' ? 'Send change request' : 'Reject submission'}
        </Button>
      </Modal>
    </Card>
  );
}
