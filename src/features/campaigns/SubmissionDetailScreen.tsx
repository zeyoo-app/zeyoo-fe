'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

import {
  AsyncContent,
  Avatar,
  Badge,
  Button,
  Card,
  ChoiceChips,
  EmptyState,
  Field,
  Modal,
  Textarea,
  useConfirm,
  type Choice,
} from '@/design-system';
import type { PostViews, RiskLevel, Submission, SubmissionHistory, SubmissionPost } from '@/shared/api';
import { platformLabel } from '@/shared/format/platform';
import { formatRelativeTime } from '@/shared/format/relativeTime';
import { formatCount, formatMoney } from '@/shared/money/money';
import { BackButton } from '@/shared/nav/BackButton';

import { useCampaign, useCampaignFraudCases, useCloseFraudCase, useFlagCreator } from './hooks';
import {
  useCampaignSubmissions,
  useReviewSubmission,
  useSubmissionHistory,
  useSubmissionViews,
  useTrackViews,
  type ViewEntry,
} from '../submissions/hooks';

export const SUBMISSION_STATUS = {
  pending: { tone: 'warning', label: 'Pending' },
  needs_changes: { tone: 'warning', label: 'Changes requested' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
} as const;

/**
 * One submission, as a brand reviews it: the creator, each post and its views, what it has
 * earned, the full back-and-forth, and every action — approve, request changes, reject,
 * sync or enter views, flag or clear the creator.
 */
export function SubmissionDetailScreen({ campaignId, submissionId }: { campaignId: string; submissionId: string }) {
  const campaign = useCampaign(campaignId);
  const submissions = useCampaignSubmissions(campaignId);
  const submission = submissions.data?.find((item) => item.id === submissionId);

  return (
    <>
      <div className="mb-4">
        <BackButton />
      </div>
      <AsyncContent isLoading={submissions.isLoading} isError={submissions.isError} data={submissions.data}>
        {() =>
          submission ? (
            <SubmissionDetail campaignId={campaignId} campaignTitle={campaign.data?.title} submission={submission} />
          ) : (
            <EmptyState
              title="Submission not found"
              description="It may have been removed. Go back to the campaign to see its submissions."
            />
          )
        }
      </AsyncContent>
    </>
  );
}

const LEVELS: Choice<RiskLevel>[] = [
  { value: 'low', label: 'Low concern' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function SubmissionDetail({
  campaignId,
  campaignTitle,
  submission,
}: {
  campaignId: string;
  campaignTitle?: string;
  submission: Submission;
}) {
  const confirm = useConfirm();
  const history = useSubmissionHistory(submission.id);
  const views = useSubmissionViews(submission.id, submission.status === 'approved');
  const review = useReviewSubmission(campaignId);
  const track = useTrackViews(campaignId);
  const fraudCases = useCampaignFraudCases(campaignId);
  const flag = useFlagCreator(campaignId);
  const closeCase = useCloseFraudCase(campaignId);
  const [rejecting, setRejecting] = useState<'reject' | 'request_changes' | null>(null);
  const [reason, setReason] = useState('');
  const [enteringViews, setEnteringViews] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [flagLevel, setFlagLevel] = useState<RiskLevel>('medium');
  const [flagNote, setFlagNote] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const status = SUBMISSION_STATUS[submission.status];
  const name = submission.creatorName ?? submission.creatorHandle;
  const readings = views.data ?? [];
  const isBusy = review.isPending || track.isPending;
  const openCase = (fraudCases.data ?? []).find(
    (item) => item.creatorId === submission.creatorId && item.status === 'open',
  );

  const approve = async () => {
    const confirmed = await confirm({
      title: 'Approve this submission?',
      message:
        submission.posts.length > 1
          ? `${submission.creatorHandle} will be paid for the verified views on all ${submission.posts.length} posts.`
          : `${submission.creatorHandle} will be paid for their verified views on this post.`,
      confirmLabel: 'Approve',
    });
    if (confirmed) review.mutate({ submissionId: submission.id, decision: 'approve' });
  };

  const updateViews = async (entries?: ViewEntry[]) => {
    setNotice(null);
    setEnteringViews(false);
    try {
      const outcome = await track.mutateAsync({ submissionId: submission.id, entries });
      if (outcome.status === 'unavailable') {
        setNotice(`${outcome.message ?? 'Views could not be read.'} Use "Enter views" to add them.`);
      } else {
        setNotice(outcome.message ? `Views updated. ${outcome.message}` : 'Views updated.');
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update views.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar name={name} src={submission.creatorAvatarUrl} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-semibold text-text">{name}</h1>
          <p className="truncate text-sm text-text-muted">
            {submission.creatorHandle}
            {campaignTitle ? ` · ${campaignTitle}` : ''}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {submission.status === 'needs_changes' ? (
        <Card className="flex flex-col gap-1">
          <p className="text-sm text-warning">Waiting for the creator to send a revision.</p>
          {submission.changeRequest ? (
            <p className="text-xs text-text-muted">You asked: {submission.changeRequest}</p>
          ) : null}
        </Card>
      ) : null}
      {submission.status === 'rejected' ? (
        <Card className="flex flex-col gap-1">
          <p className="text-sm text-danger">You rejected this submission.</p>
          {submission.rejectionReason ? (
            <p className="text-xs text-text-muted">Reason: {submission.rejectionReason}</p>
          ) : null}
        </Card>
      ) : null}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-text">
          {submission.kind === 'upload' ? 'Content' : 'Posts'}
        </h2>
        <Card className="flex flex-col divide-y divide-border p-0">
          {submission.kind === 'upload' ? (
            <div className="p-4">
              <a
                href={submission.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-green-text hover:underline"
              >
                ▶ Watch uploaded video
              </a>
              {readings[0] ? <ReadingLine reading={readings[0]} /> : null}
            </div>
          ) : (
            submission.posts.map((post) => (
              <PostRow
                key={post.platform}
                post={post}
                verified={submission.verifiedPlatforms?.includes(post.platform) ?? false}
                reading={readings.find((reading) => reading.platform === post.platform)}
                showViews={submission.status === 'approved'}
              />
            ))
          )}
          {submission.note ? (
            <div className="flex flex-col gap-1 p-4">
              <p className="text-xs uppercase tracking-wide text-text-tertiary">Note from the creator</p>
              <p className="text-sm text-text">{submission.note}</p>
            </div>
          ) : null}
        </Card>
      </section>

      {submission.status === 'pending' ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="sm:w-auto" loading={review.isPending} onClick={() => void approve()}>
            Approve
          </Button>
          <Button variant="secondary" className="sm:w-auto" disabled={isBusy} onClick={() => setRejecting('request_changes')}>
            Request changes
          </Button>
          <Button variant="secondary" className="sm:w-auto" disabled={isBusy} onClick={() => setRejecting('reject')}>
            Reject
          </Button>
        </div>
      ) : null}
      {review.error ? (
        <p className="text-xs text-danger">
          {review.error instanceof Error ? review.error.message : 'Could not save your decision.'}
        </p>
      ) : null}

      {submission.status === 'approved' ? (
        <>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-text">Views and earnings</h2>
            <Card className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-4">
                <Total label="Total views" value={formatCount(submission.views)} />
                <Total label="Earned" value={formatMoney(submission.earning)} />
              </div>
              {submission.risk === 'high' || submission.risk === 'medium' ? (
                <p className="text-xs text-warning">
                  {submission.risk === 'high'
                    ? 'Engagement looks unusual: more likes, comments and shares than views.'
                    : 'Engagement looks unusual: interactions but no recorded views.'}
                </p>
              ) : null}
              {notice ? <p className="text-xs text-text-muted">{notice}</p> : null}
              <div className="flex gap-2">
                <Button size="sm" fullWidth={false} loading={track.isPending} disabled={isBusy} onClick={() => void updateViews()}>
                  Sync views
                </Button>
                <Button size="sm" variant="secondary" fullWidth={false} disabled={isBusy} onClick={() => setEnteringViews(true)}>
                  Enter views
                </Button>
              </div>
            </Card>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-text">Earnings review</h2>
            <Card className="flex flex-col items-start gap-3">
              {submission.earningsPaused ? (
                <>
                  <p className="text-sm text-warning">
                    Earnings paused. This creator earns nothing more here until you clear the flag.
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth={false}
                    loading={closeCase.isPending}
                    disabled={!openCase}
                    onClick={() => openCase && closeCase.mutate({ caseId: openCase.id, action: 'clear' })}
                  >
                    Clear flag and resume
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-text-muted">
                    If something looks wrong, flag the creator to pause their earnings on this campaign while it is
                    reviewed.
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth={false}
                    disabled={isBusy}
                    onClick={() => {
                      setFlagLevel(submission.risk === 'high' ? 'high' : 'medium');
                      setFlagNote('');
                      setFlagging(true);
                    }}
                  >
                    Flag creator
                  </Button>
                </>
              )}
            </Card>
          </section>
        </>
      ) : null}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-text">History</h2>
        <Card className="flex flex-col gap-4">
          <Timeline history={history.data} />
        </Card>
      </section>

      <EnterViewsModal
        open={enteringViews}
        submission={submission}
        readings={readings}
        onClose={() => setEnteringViews(false)}
        onSave={(entries) => void updateViews(entries)}
      />

      <Modal open={flagging} onClose={() => setFlagging(false)} title="Flag for review">
        <p className="text-sm text-text-muted">
          {name} will stop earning on this campaign right away and be told why. Earnings already paid stay paid. You
          can clear the flag at any time and earning resumes.
        </p>
        <ChoiceChips accessibilityLabel="How serious is the concern" choices={LEVELS} value={flagLevel} onChange={setFlagLevel} />
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

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title={rejecting === 'request_changes' ? 'Request changes' : 'Reject submission'}
      >
        <p className="text-sm text-text-muted">
          {rejecting === 'request_changes'
            ? `Tell ${submission.creatorHandle} what to change. They can submit revised posts.`
            : `Tell ${submission.creatorHandle} why this doesn’t fit the brief.`}
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
    </div>
  );
}

function PostRow({
  post,
  verified,
  reading,
  showViews,
}: {
  post: SubmissionPost;
  verified: boolean;
  reading?: PostViews;
  showViews: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text">{platformLabel(post.platform)}</p>
        <Badge tone={verified ? 'success' : 'neutral'}>{verified ? 'Verified account' : 'Unverified account'}</Badge>
      </div>
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 items-center gap-1.5 text-xs text-green-text hover:underline"
      >
        <span className="truncate">{post.url}</span>
        <ExternalLink aria-hidden className="size-3.5 shrink-0" />
      </a>
      {showViews ? <ReadingLine reading={reading} /> : null}
    </div>
  );
}

function ReadingLine({ reading }: { reading?: PostViews }) {
  if (!reading?.capturedAt) return <p className="text-xs text-text-tertiary">No views recorded yet</p>;
  return (
    <p className="text-xs text-text-tertiary">
      <span className="font-numeric text-sm text-text">{formatCount(reading.views)}</span> views ·{' '}
      {reading.source === 'platform' ? 'synced' : 'entered'} {formatRelativeTime(reading.capturedAt)}
    </p>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="font-numeric text-2xl leading-none text-text">{value}</p>
    </div>
  );
}

/** One field per post, or a single one for an uploaded video. Only changed counts are saved. */
function EnterViewsModal({
  open,
  submission,
  readings,
  onClose,
  onSave,
}: {
  open: boolean;
  submission: Submission;
  readings: PostViews[];
  onClose: () => void;
  onSave: (entries: ViewEntry[]) => void;
}) {
  const fields =
    submission.posts.length === 0
      ? [{ key: 'upload', platform: undefined, current: readings[0]?.views ?? submission.views }]
      : submission.posts.map((post) => ({
          key: post.platform,
          platform: post.platform,
          current:
            readings.find((reading) => reading.platform === post.platform)?.views ??
            (submission.posts.length === 1 ? submission.views : 0),
        }));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openedFor, setOpenedFor] = useState(false);

  // Fill the fields in each time the modal opens, not on every refetch while typing.
  if (open !== openedFor) {
    setOpenedFor(open);
    if (open) {
      setDrafts(Object.fromEntries(fields.map((field) => [field.key, field.current > 0 ? String(field.current) : ''])));
    }
  }

  const entries = fields.flatMap((field): ViewEntry[] => {
    const draft = (drafts[field.key] ?? '').replace(/[^0-9]/g, '');
    if (!draft) return [];
    const views = Number(draft);
    if (!Number.isSafeInteger(views) || views === field.current) return [];
    return [{ platform: field.platform, views }];
  });

  return (
    <Modal open={open} onClose={onClose} title="Enter views">
      <p className="text-sm text-text-muted">
        {fields.length > 1
          ? `The total views each of ${submission.creatorHandle}'s posts has right now.`
          : `The total views ${submission.creatorHandle}'s post has right now.`}{' '}
        Earnings are credited for any increase.
      </p>
      {fields.map((field) => (
        <Field
          key={field.key}
          label={field.platform ? `${platformLabel(field.platform)} views` : 'Total views'}
          inputMode="numeric"
          placeholder="e.g. 12500"
          value={drafts[field.key] ?? ''}
          onChange={(event) => setDrafts((current) => ({ ...current, [field.key]: event.target.value }))}
        />
      ))}
      <Button disabled={entries.length === 0} onClick={() => onSave(entries)}>
        Save views
      </Button>
    </Modal>
  );
}

const DECISION_LABEL = {
  approve: 'Approved',
  request_changes: 'Changes requested',
  reject: 'Rejected',
} as const;

/** Every version the creator sent and every decision on it, oldest first. */
function Timeline({ history }: { history?: SubmissionHistory }) {
  if (!history) return <p className="text-sm text-text-muted">Loading history…</p>;
  const events = [
    ...history.revisions.map((revision, index) => ({
      at: revision.createdAt,
      title: index === 0 ? 'Submitted' : 'Revision sent',
      detail:
        revision.kind === 'upload'
          ? 'Uploaded a video'
          : revision.posts.map((post) => platformLabel(post.platform)).join(', '),
      note: revision.note,
    })),
    ...history.reviews.map((entry) => ({
      at: entry.createdAt,
      title: DECISION_LABEL[entry.decision],
      detail: undefined,
      note: entry.note,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <>
      {events.map((event, index) => (
        <div key={`${event.at}-${index}`} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-text">{event.title}</p>
            <p className="text-xs text-text-tertiary">{formatRelativeTime(event.at)}</p>
          </div>
          {event.detail ? <p className="text-xs text-text-muted">{event.detail}</p> : null}
          {event.note ? <p className="text-sm text-text">“{event.note}”</p> : null}
        </div>
      ))}
    </>
  );
}
