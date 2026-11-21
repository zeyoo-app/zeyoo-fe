'use client';

import { useState } from 'react';
import { BadgeCheck, ExternalLink } from 'lucide-react';

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
import type {
  PayoutPreview,
  PayoutQuote,
  PostViews,
  PreviewPost,
  RiskLevel,
  Submission,
  SubmissionHistory,
  SubmissionPost,
} from '@/shared/api';
import { platformLabel } from '@/shared/format/platform';
import { formatRelativeTime } from '@/shared/format/relativeTime';
import { formatCount, formatMoney } from '@/shared/money/money';
import { BackButton } from '@/shared/nav/BackButton';

import { useCampaign, useCampaignFraudCases, useCloseFraudCase, useFlagCreator } from './hooks';
import {
  useApproveSubmission,
  useCampaignSubmissions,
  usePayForNewViews,
  usePayoutPreview,
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
  const approval = useApproveSubmission(campaignId);
  const isPending = submission.status === 'pending';
  // While it waits on the brand: every channel's views now and what approving would pay.
  // Pending: what approving would pay. Approved: what's owed for views since the last payment.
  const preview = usePayoutPreview(submission.id, isPending || submission.status === 'approved');
  const payment = usePayForNewViews(campaignId);
  const quote = preview.data?.quote;
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
  const isBusy = review.isPending || approval.isPending || payment.isPending || track.isPending;
  const openCase = (fraudCases.data ?? []).find(
    (item) => item.creatorId === submission.creatorId && item.status === 'open',
  );

  const approve = async () => {
    const confirmed = await confirm({
      title: quote ? `Approve and pay ${formatMoney(quote.payNow)}?` : 'Approve this submission?',
      message: approvalMessage(submission.creatorHandle, quote),
      confirmLabel: quote ? `Approve & pay ${formatMoney(quote.payNow)}` : 'Approve',
    });
    if (!confirmed) return;
    setNotice(null);
    approval.mutate(submission.id, {
      onSuccess: (outcome) =>
        setNotice(
          outcome.payoutDeferred
            ? "Approved. Payment couldn't go through; you can pay from this page."
            : outcome.paidNow.minorUnits > 0
              ? `Approved. ${formatMoney(outcome.paidNow)} paid to ${submission.creatorHandle}.`
              : 'Approved. Nothing to pay yet; pay for new views here when they come in.',
        ),
    });
  };

  const payNewViews = async () => {
    if (!quote) return;
    const amount = formatMoney(quote.payNow);
    const confirmed = await confirm({
      title: `Pay ${amount}?`,
      message: `${submission.creatorHandle} gets ${amount} for the views their posts gained since you last paid.`,
      confirmLabel: `Pay ${amount}`,
    });
    if (!confirmed) return;
    setNotice(null);
    payment.mutate(submission.id, {
      onSuccess: (outcome) =>
        setNotice(
          outcome.payoutDeferred
            ? "Payment couldn't go through. Try again in a moment."
            : `${formatMoney(outcome.paidNow)} paid to ${submission.creatorHandle}.`,
        ),
      onError: (error) =>
        setNotice(error instanceof Error ? error.message : "Payment couldn't go through. Try again in a moment."),
    });
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
        <h2 className="mb-3 font-display text-lg font-semibold text-text">Posts</h2>
        <Card className="flex flex-col divide-y divide-border p-0">
          {submission.posts.map((post) => (
            <PostRow
              key={post.platform}
              post={post}
              verified={submission.verifiedPlatforms?.includes(post.platform) ?? false}
              reading={readings.find((reading) => reading.platform === post.platform)}
              showViews={submission.status === 'approved'}
              preview={
                isPending ? preview.data?.posts.find((item) => item.platform === post.platform && item.url) : undefined
              }
              previewLoading={isPending && preview.isLoading}
              onEnterViews={() => setEnteringViews(true)}
              enterDisabled={isBusy}
            />
          ))}
          {submission.kind === 'upload' ? (
            // The original file that came with the posts. Older submissions sent only a
            // video, so their typed-in views are shown here.
            <div className="flex flex-col gap-2 p-4">
              <p className="text-[13px] font-medium text-text-muted">Original video</p>
              <video
                src={submission.postUrl}
                controls
                playsInline
                preload="metadata"
                className="max-h-[520px] w-full rounded-xl bg-black object-contain"
              >
                <a href={submission.postUrl} className="text-sm text-green-text">Download the video</a>
              </video>
              {submission.posts.length === 0 && readings[0] ? <ReadingLine reading={readings[0]} /> : null}
            </div>
          ) : null}
          {submission.note ? (
            <div className="flex flex-col gap-1 p-4">
              <p className="text-xs uppercase tracking-wide text-text-tertiary">Note from the creator</p>
              <p className="text-sm text-text">{submission.note}</p>
            </div>
          ) : null}
        </Card>
      </section>

      {isPending ? (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-text">Payout on approval</h2>
          <PayoutCard
            preview={preview.data}
            loading={preview.isLoading}
            failed={preview.isError}
            notice={notice}
          />
        </section>
      ) : null}

      {isPending ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="sm:w-auto"
            loading={approval.isPending}
            disabled={isBusy || preview.isLoading}
            onClick={() => void approve()}
          >
            {quote && quote.payNow.minorUnits > 0 ? `Approve & pay ${formatMoney(quote.payNow)}` : 'Approve'}
          </Button>
          <Button variant="secondary" className="sm:w-auto" disabled={isBusy} onClick={() => setRejecting('request_changes')}>
            Request changes
          </Button>
          <Button variant="secondary" className="sm:w-auto" disabled={isBusy} onClick={() => setRejecting('reject')}>
            Reject
          </Button>
        </div>
      ) : null}
      {review.error || approval.error ? (
        <p className="text-xs text-danger">
          {(review.error ?? approval.error) instanceof Error
            ? (review.error ?? approval.error)?.message
            : 'Could not save your decision.'}
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
              {quote && quote.payNow.minorUnits > 0 ? (
                <div className="flex items-center gap-3 rounded-xl bg-surface-raised p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm font-medium text-text">{formatMoney(quote.payNow)} unpaid</p>
                    <p className="text-xs text-text-muted">For views since the last payment. Nothing pays until you do.</p>
                  </div>
                  <Button size="sm" fullWidth={false} loading={payment.isPending} disabled={isBusy} onClick={() => void payNewViews()}>
                    Pay {formatMoney(quote.payNow)}
                  </Button>
                </div>
              ) : null}
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
        readings={isPending ? previewReadings(preview.data) : readings}
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
  preview,
  previewLoading,
  onEnterViews,
  enterDisabled,
}: {
  post: SubmissionPost;
  verified: boolean;
  reading?: PostViews;
  showViews: boolean;
  preview?: PreviewPost;
  previewLoading?: boolean;
  onEnterViews?: () => void;
  enterDisabled?: boolean;
}) {
  const views = postViews({ reading, showViews, preview, previewLoading });
  // Counts that aren't read from the platform are typed in by the brand.
  const canEnter = Boolean(onEnterViews) && views.typedIn;
  const label = platformLabel(post.platform);
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-text">
          {label}
          {verified ? (
            <BadgeCheck aria-label="Verified account" className="size-4 text-green-text" />
          ) : (
            <span className="text-xs font-normal text-text-tertiary">Unverified</span>
          )}
        </p>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted hover:text-text hover:underline"
        >
          <span className="truncate">{displayUrl(post.url)}</span>
          <ExternalLink aria-hidden className="size-3 shrink-0 text-text-tertiary" />
        </a>
      </div>
      {views.shown ? (
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className={`font-numeric text-sm ${views.count === null ? 'text-text-tertiary' : 'text-text'}`}>
            {views.count === null ? '—' : formatCount(views.count)}
          </span>
          {canEnter ? (
            <button
              type="button"
              disabled={enterDisabled}
              onClick={onEnterViews}
              aria-label={`Enter views for ${label}`}
              className="text-xs text-green-text hover:underline disabled:opacity-50"
            >
              {views.count === null ? 'Enter views' : 'Edit'}
            </button>
          ) : (
            <span className="text-xs text-text-tertiary">{views.detail}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** What a post's views column shows: the count, where it came from, and if it's typed in. */
function postViews({
  reading,
  showViews,
  preview,
  previewLoading,
}: {
  reading?: PostViews;
  showViews: boolean;
  preview?: PreviewPost;
  previewLoading?: boolean;
}): { shown: boolean; count: number | null; detail: string; typedIn: boolean } {
  const detail = (source: string | null | undefined, at?: string) =>
    `${source === 'live' ? 'views now' : source === 'manual' ? 'entered' : 'synced'}${
      at && source !== 'live' ? ` ${formatRelativeTime(at)}` : ''
    }`;
  if (showViews) {
    if (!reading?.capturedAt) return { shown: true, count: null, detail: 'No views yet', typedIn: true };
    return {
      shown: true,
      count: reading.views,
      detail: detail(reading.source === 'platform' ? 'platform' : 'manual', reading.capturedAt),
      typedIn: reading.source !== 'platform',
    };
  }
  if (preview) {
    return { shown: true, count: preview.views, detail: detail(preview.source, preview.capturedAt), typedIn: preview.source !== 'live' };
  }
  if (previewLoading) return { shown: true, count: null, detail: 'Reading…', typedIn: false };
  return { shown: false, count: null, detail: '', typedIn: false };
}

/** A post link without the scheme and "www.", which only add noise in a narrow row. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
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

/** What approving pays now and why, so the brand sees the cost before deciding. */
function PayoutCard({
  preview,
  loading,
  failed,
  notice,
}: {
  preview?: PayoutPreview;
  loading: boolean;
  failed: boolean;
  notice: string | null;
}) {
  if (!preview) {
    return (
      <Card>
        <p className="text-sm text-text-muted">
          {failed ? "Couldn't work out the payout. Refresh to try again." : loading ? 'Reading current views…' : ''}
        </p>
      </Card>
    );
  }
  const { quote } = preview;
  return (
    <Card className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-4">
        <Total label="Total views" value={formatCount(preview.totalViews)} />
        <Total label="Pay now" value={formatMoney(quote.payNow)} />
      </div>
      <p className="text-xs text-text-muted">
        {quote.rewardType === 'fixed'
          ? `Fixed reward of ${formatMoney(quote.reward)}`
          : `${formatMoney(quote.reward)} per 1,000 views`}
        {quote.cap ? ` · up to ${formatMoney(quote.cap)} per creator` : ''}
      </p>
      {quote.alreadyPaid.minorUnits > 0 ? (
        <p className="text-xs text-text-muted">
          {formatMoney(quote.alreadyPaid)} already paid on this campaign; only the difference is paid now.
        </p>
      ) : null}
      {quote.paused ? (
        <p className="text-xs text-warning">Earnings are paused for this creator, so nothing is paid now.</p>
      ) : quote.limitedBy === 'budget' ? (
        <p className="text-xs text-warning">Held to the {formatMoney(quote.budgetRemaining)} left in the funded budget.</p>
      ) : quote.limitedBy === 'cap' ? (
        <p className="text-xs text-text-muted">Held to the per-creator limit.</p>
      ) : null}
      {notice ? <p className="text-xs text-text-muted">{notice}</p> : null}
    </Card>
  );
}

/** The preview's counts in the shape the views form fills its fields from. */
function previewReadings(preview: PayoutPreview | undefined): PostViews[] {
  return (preview?.posts ?? []).map((post) => ({
    platform: post.platform,
    url: post.url,
    views: post.views ?? 0,
    likes: 0,
    comments: 0,
    shares: 0,
    capturedAt: post.capturedAt,
  }));
}

/** The confirm message: who gets what, for which views, and what happens after. */
function approvalMessage(handle: string, quote: PayoutQuote | undefined): string {
  if (!quote) return `${handle} will be paid for their verified views on this post.`;
  if (quote.paused) return `${handle}'s earnings are paused for review, so nothing is paid until the flag is cleared.`;
  if (quote.rewardType === 'fixed') return `${handle} gets the fixed reward of ${formatMoney(quote.payNow)} now.`;
  if (quote.payNow.minorUnits === 0) {
    return `No views have been counted yet, so nothing is paid now. Pay for views from this page once they're in.`;
  }
  return `${handle} gets ${formatMoney(quote.payNow)} now for ${formatCount(quote.views)} views at ${formatMoney(
    quote.reward,
  )} per 1,000. Views after this are paid only when you pay for them.`;
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
        Nothing is paid until you approve or pay.
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
      detail: [
        revision.posts.map((post) => platformLabel(post.platform)).join(', '),
        revision.kind === 'upload' ? 'Uploaded a video' : '',
      ]
        .filter(Boolean)
        .join(' · '),
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
