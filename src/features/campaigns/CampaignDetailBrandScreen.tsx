'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, ChevronRight, LifeBuoy, Pencil, UserPlus, XCircle } from 'lucide-react';

import {
  ActionsMenu,
  AsyncContent,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  ProgressBar,
  TabBar,
  Textarea,
  useConfirm,
  type MenuAction,
} from '@/design-system';
import type { Campaign, FraudCase, Submission } from '@/shared/api';
import { formatCampaignReward, formatCount, formatMoney } from '@/shared/money/money';
import { platformLabel, platformsLabel } from '@/shared/format/platform';
import { BackButton } from '@/shared/nav/BackButton';

import { ApplicationsReview, visibleApplications } from './ApplicationsReview';
import { CampaignCover } from './CampaignCover';
import { SUBMISSION_STATUS } from './SubmissionDetailScreen';
import {
  CampaignAboutSection,
  CampaignBriefSection,
  CampaignReferencesSection,
  CampaignRequirementsSection,
  CampaignScheduleSection,
} from './CampaignInfoSections';
import { useOpenDispute } from '@/shared/disputes/hooks';
import { useCampaign, useCampaignFraudCases, useCloseFraudCase, useSetCampaignStatus } from './hooks';
import { useCampaignApplications, useCampaignSubmissions } from '../submissions/hooks';

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
                <p className="text-xs text-text-tertiary">{campaign.submissionCount} {campaign.submissionCount === 1 ? 'submission' : 'submissions'}</p>
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

/** One submission in the list: who, where they posted, views and earnings. Opens its page. */
function SubmissionRow({ submission, campaignId }: { submission: Submission; campaignId: string }) {
  const status = SUBMISSION_STATUS[submission.status];
  const name = submission.creatorName ?? submission.creatorHandle;
  const where =
    submission.kind === 'upload'
      ? 'Uploaded video'
      : submission.posts.map((post) => platformLabel(post.platform)).join(' · ');
  const attention =
    submission.status === 'approved' && submission.earningsPaused
      ? 'Earnings paused'
      : submission.status === 'approved' && (submission.risk === 'high' || submission.risk === 'medium')
        ? 'Unusual engagement'
        : null;

  return (
    <Link
      href={`/brand/campaigns/${campaignId}/submissions/${submission.id}`}
      aria-label={`Open ${name}'s submission`}
      className="block rounded-2xl transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Card className="flex items-center gap-3 p-4">
        <Avatar name={name} src={submission.creatorAvatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{name}</p>
          <p className="truncate text-xs text-text-muted">
            {submission.creatorHandle} · {where}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            <span className="font-numeric text-sm text-text">{formatCount(submission.views)}</span> views ·{' '}
            <span className="font-numeric text-sm text-text">{formatMoney(submission.earning)}</span>
          </p>
          {attention ? <p className="mt-1 text-xs text-warning">{attention}</p> : null}
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-text-tertiary rtl:rotate-180" />
      </Card>
    </Link>
  );
}
