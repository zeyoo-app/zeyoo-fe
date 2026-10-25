'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Badge, Button, Card, Field, SegmentedToggle, Textarea } from '@/design-system';
import type { Campaign, CreatorSubmission, MyApplication, SubmissionKind } from '@/shared/api';

import {
  useApplyToCampaign,
  useMyApplications,
  useMyInvitations,
  useMySubmissions,
  useResubmit,
  useSubmitParticipation,
  useWithdrawApplication,
} from '../submissions/hooks';

const KIND_OPTIONS: { value: SubmissionKind; label: string }[] = [
  { value: 'link', label: 'Paste link' },
  { value: 'upload', label: 'Upload' },
];

const SUBMISSION_STATUS: Record<CreatorSubmission['status'], { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral' }> = {
  pending: { label: 'Pending review', tone: 'neutral' },
  needs_changes: { label: 'Changes requested', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

const APPLICATION_COPY: Record<Exclude<MyApplication['status'], 'approved'>, { label: string; tone: 'neutral' | 'danger'; body: string }> = {
  pending: { label: 'Pending', tone: 'neutral', body: 'Your application is with the brand. We will notify you when they decide.' },
  declined: { label: 'Not approved', tone: 'danger', body: 'The brand did not approve your application for this campaign.' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral', body: 'You withdrew your application to this campaign.' },
};

/**
 * Where a creator stands on a campaign, and the one thing they can do next (contract §1.3):
 * apply and accept the terms → wait for the brand → submit → revise if changes are asked for.
 */
export function ParticipationSection({ campaign }: { campaign: Campaign }) {
  const applications = useMyApplications();
  const submissions = useMySubmissions();
  if (applications.isLoading || submissions.isLoading) return null;

  const submission = submissions.data?.find((item) => item.campaignId === campaign.id);
  if (submission) return <SubmittedCard submission={submission} />;

  const application = applications.data?.find((item) => item.campaignId === campaign.id);
  if (!application) return <ApplyCard campaign={campaign} />;
  if (application.status === 'approved') {
    return (
      <Card className="mt-4">
        <h2 className="font-display text-lg font-semibold text-text">Submit your content</h2>
        <p className="mt-1 text-sm text-text-muted">Your application was approved. Post your content, then submit it here.</p>
        <SubmitForm campaignId={campaign.id} />
      </Card>
    );
  }
  const copy = APPLICATION_COPY[application.status];
  return <ApplicationStatusCard application={application} copy={copy} />;
}

function ApplyCard({ campaign }: { campaign: Campaign }) {
  const apply = useApplyToCampaign();
  const invitations = useMyInvitations();
  const invited = Boolean(invitations.data?.some((item) => item.campaignId === campaign.id));
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <Card className="mt-4 flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-text">{invited ? 'Accept your invitation' : 'Apply to join'}</h2>
      <p className="text-sm text-text-muted">
        The brand reviews each application. Once you are approved you can submit your content and start earning.
      </p>
      <Textarea
        placeholder="Message to the brand (optional) — why you are a good fit"
        value={message}
        maxLength={1000}
        onChange={(event) => setMessage(event.target.value)}
      />
      <label className="flex items-start gap-3 text-sm text-text">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[var(--primary)]"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>
          I accept this campaign&apos;s terms — its brief, requirements and reward terms — and Zeyoo&apos;s{' '}
          <Link href="/campaign-rules" target="_blank" className="text-green-text underline">
            Campaign Rules
          </Link>
          .
        </span>
      </label>
      {apply.error ? (
        <p className="text-xs text-danger">
          {apply.error instanceof Error ? apply.error.message : 'Could not send your application.'}
        </p>
      ) : null}
      <div>
        <Button
          fullWidth={false}
          loading={apply.isPending}
          disabled={!accepted || apply.isPending}
          onClick={() => apply.mutate({ campaignId: campaign.id, message })}
        >
          {invited ? 'Accept and apply' : 'Apply'}
        </Button>
      </div>
    </Card>
  );
}

function ApplicationStatusCard({
  application,
  copy,
}: {
  application: MyApplication;
  copy: (typeof APPLICATION_COPY)[keyof typeof APPLICATION_COPY];
}) {
  const withdraw = useWithdrawApplication();
  return (
    <Card className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text">Your application</h2>
        <Badge tone={copy.tone}>{copy.label}</Badge>
      </div>
      <p className="text-sm text-text-muted">{copy.body}</p>
      {application.status === 'pending' ? (
        <div>
          <Button variant="secondary" fullWidth={false} loading={withdraw.isPending} onClick={() => withdraw.mutate(application.id)}>
            Withdraw application
          </Button>
        </div>
      ) : null}
      {withdraw.error ? (
        <p className="text-xs text-danger">{withdraw.error instanceof Error ? withdraw.error.message : 'Could not withdraw.'}</p>
      ) : null}
    </Card>
  );
}

function SubmittedCard({ submission }: { submission: CreatorSubmission }) {
  const status = SUBMISSION_STATUS[submission.status];
  return (
    <Card className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text">Your submission</h2>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className="truncate text-sm text-text-muted">{submission.postUrl}</p>
      {submission.status === 'needs_changes' ? (
        <>
          <p className="text-sm text-warning">
            The brand asked for changes{submission.changeRequest ? `: ${submission.changeRequest}` : '.'}
          </p>
          <SubmitForm campaignId={submission.campaignId} revisionOf={submission.id} />
        </>
      ) : (
        <Link href="/creator/submissions" className="text-sm text-green-text">
          See it in My submissions →
        </Link>
      )}
    </Card>
  );
}

/** A new submission, or — with `revisionOf` — the revised post after changes were requested. */
function SubmitForm({ campaignId, revisionOf }: { campaignId: string; revisionOf?: string }) {
  const router = useRouter();
  const submit = useSubmitParticipation();
  const resubmit = useResubmit();
  const [kind, setKind] = useState<SubmissionKind>('link');
  const [postUrl, setPostUrl] = useState('');
  const pending = submit.isPending || resubmit.isPending;
  const error = submit.error ?? resubmit.error;
  const canSubmit = postUrl.trim().length > 4 && !pending;

  function onSubmit() {
    const done = { onSuccess: () => router.replace('/creator/submissions') };
    if (revisionOf) {
      resubmit.mutate({ submissionId: revisionOf, postUrl: postUrl.trim(), kind }, done);
    } else {
      submit.mutate({ campaignId, postUrl: postUrl.trim(), kind }, done);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="max-w-xs">
        <SegmentedToggle options={KIND_OPTIONS} value={kind} onChange={setKind} ariaLabel="Submission type" />
      </div>
      <Field
        placeholder={kind === 'link' ? 'https://instagram.com/p/…' : 'Uploaded file URL'}
        value={postUrl}
        onChange={(event) => setPostUrl(event.target.value)}
        aria-label={revisionOf ? 'Revised post URL' : 'Post URL'}
      />
      {error ? <p className="text-xs text-danger">{error instanceof Error ? error.message : 'Could not submit.'}</p> : null}
      <div>
        <Button fullWidth={false} loading={pending} disabled={!canSubmit} onClick={onSubmit}>
          {revisionOf ? 'Submit revision' : 'Submit for review'}
        </Button>
      </div>
    </div>
  );
}
