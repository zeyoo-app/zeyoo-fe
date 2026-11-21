'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Badge, Button, Card, Field } from '@/design-system';
import { useApi } from '@/shared/api';
import { uploadVideo } from '@/shared/media/videoUpload';
import type { Campaign, CreatorSubmission, PostPlatform } from '@/shared/api';
import { platformLabel } from '@/shared/format/platform';
import { POST_LINK_PLACEHOLDERS, postLinkProblem } from '@/shared/format/postLinks';

import {
  useMyApplications,
  useMyInvitations,
  useMySubmissions,
  useResubmit,
  useSubmitParticipation,
} from '../submissions/hooks';

const SUBMISSION_STATUS: Record<CreatorSubmission['status'], { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral' }> = {
  pending: { label: 'Pending review', tone: 'neutral' },
  needs_changes: { label: 'Changes requested', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

/**
 * Where a creator stands on a campaign, and the one thing they can do next (contract §1.3).
 * There is no application to wait on: a creator posts their content, submits the link
 * here, and the brand approves or rejects the submission itself. An approved submission
 * is what earns. A revision follows if the brand asks for changes.
 */
export function ParticipationSection({ campaign }: { campaign: Campaign }) {
  const applications = useMyApplications();
  const submissions = useMySubmissions();
  if (applications.isLoading || submissions.isLoading) return null;

  const submission = submissions.data?.find((item) => item.campaignId === campaign.id);
  if (submission) return <SubmittedCard campaign={campaign} submission={submission} />;

  const application = applications.data?.find((item) => item.campaignId === campaign.id);
  if (application?.status === 'declined') return <DeclinedCard />;
  // Anyone who applied under the old flow already accepted the terms then.
  return <SubmitContentCard campaign={campaign} termsAlreadyAccepted={Boolean(application)} />;
}

function SubmitContentCard({ campaign, termsAlreadyAccepted }: { campaign: Campaign; termsAlreadyAccepted: boolean }) {
  const invitations = useMyInvitations();
  const invited = Boolean(invitations.data?.some((item) => item.campaignId === campaign.id));
  const [accepted, setAccepted] = useState(termsAlreadyAccepted);

  return (
    <Card className="mt-4 flex flex-col gap-1">
      <h2 className="font-display text-lg font-semibold text-text">Submit your content</h2>
      <p className="text-sm text-text-muted">
        {invited ? 'You were invited to this campaign. ' : ''}Publish your post, then paste its link here. The brand
        reviews your submission, and you are paid once it is approved.
      </p>
      <SubmitForm
        campaign={campaign}
        acceptedTerms={accepted}
        blocked={!accepted}
        beforeSubmit={
          termsAlreadyAccepted ? null : (
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
          )
        }
      />
    </Card>
  );
}

function DeclinedCard() {
  return (
    <Card className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text">Your participation</h2>
        <Badge tone="danger">Not approved</Badge>
      </div>
      <p className="text-sm text-text-muted">The brand did not approve your participation in this campaign.</p>
    </Card>
  );
}

function SubmittedCard({ campaign, submission }: { campaign: Campaign; submission: CreatorSubmission }) {
  const status = SUBMISSION_STATUS[submission.status];
  return (
    <Card className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text">Your submission</h2>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      {submission.posts.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {submission.posts.map((post) => (
            <li key={post.platform} className="truncate text-sm text-text-muted">
              {platformLabel(post.platform)} ·{' '}
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-green-text hover:underline">
                {post.url}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {submission.kind === 'upload' ? (
        <p className="text-sm text-text-muted">
          {submission.posts.length > 0 ? '+ Original video attached' : 'Uploaded video'}
        </p>
      ) : null}
      {submission.status === 'needs_changes' ? (
        <>
          <p className="text-sm text-warning">
            The brand asked for changes{submission.changeRequest ? `: ${submission.changeRequest}` : '.'}
          </p>
          <SubmitForm campaign={campaign} revisionOf={submission} />
        </>
      ) : (
        <Link href="/creator/submissions" className="text-sm text-green-text">
          See it in My submissions →
        </Link>
      )}
    </Card>
  );
}

/** The platforms a creator can post on for this campaign, in the order the brand chose. */
function campaignPlatforms(campaign: Campaign): PostPlatform[] {
  return campaign.platforms.length > 0 ? campaign.platforms : [campaign.platform];
}

/**
 * A new submission, or — with `revisionOf` — the revised content after changes were
 * requested. Links go one per campaign platform; at least one is needed, since the
 * posts are what get reviewed, tracked for views and paid. The original video can be
 * added too, as an extra for the brand.
 */
function SubmitForm({
  campaign,
  revisionOf,
  acceptedTerms,
  blocked = false,
  beforeSubmit,
}: {
  campaign: Campaign;
  revisionOf?: CreatorSubmission;
  /** Sent with a first submission, which is how the creator joins the campaign. */
  acceptedTerms?: boolean;
  /** Holds the button until something outside the form is done, such as accepting the terms. */
  blocked?: boolean;
  /** Shown just above the button, e.g. the terms the creator must accept first. */
  beforeSubmit?: ReactNode;
}) {
  const router = useRouter();
  const submit = useSubmitParticipation();
  const resubmit = useResubmit();
  const platforms = campaignPlatforms(campaign);
  // A revision starts from the links the creator sent last time.
  const [links, setLinks] = useState<Partial<Record<PostPlatform, string>>>(() =>
    Object.fromEntries((revisionOf?.posts ?? []).map((post) => [post.platform, post.url])),
  );
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const pending = submit.isPending || resubmit.isPending;
  const error = submit.error ?? resubmit.error;

  const filled = platforms
    .map((platform) => ({ platform, url: (links[platform] ?? '').trim() }))
    .filter((post) => post.url.length > 0);
  const linksValid = filled.every((post) => postLinkProblem(post.url, post.platform) === null);
  // A video still uploading holds the button, so it isn't silently left out.
  const ready = filled.length > 0 && linksValid && !uploading;
  const canSubmit = ready && !pending && !blocked;

  function onSubmit() {
    if (!ready) return;
    const content = uploadedUrl
      ? { kind: 'upload' as const, posts: filled, videoUrl: uploadedUrl }
      : { kind: 'link' as const, posts: filled };
    const done = { onSuccess: () => router.replace('/creator/submissions') };
    if (revisionOf) {
      resubmit.mutate({ submissionId: revisionOf.id, ...content }, done);
    } else {
      submit.mutate({ campaignId: campaign.id, acceptedTerms, ...content }, done);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <>
          {platforms.length > 1 ? (
            <p className="text-xs text-text-muted">Add a link for each platform you posted on. You need at least one.</p>
          ) : null}
          {platforms.map((platform) => {
            const value = links[platform] ?? '';
            return (
              <Field
                key={platform}
                label={`${platformLabel(platform)} post link`}
                placeholder={POST_LINK_PLACEHOLDERS[platform]}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                value={value}
                onChange={(event) => setLinks((current) => ({ ...current, [platform]: event.target.value }))}
                error={value.trim() ? (postLinkProblem(value, platform) ?? undefined) : undefined}
              />
            );
          })}
      </>
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-text-muted">Original video (optional)</p>
        <VideoUploadField onUploaded={setUploadedUrl} onUploadingChange={setUploading} />
      </div>
      {error ? <p className="text-xs text-danger">{error instanceof Error ? error.message : 'Could not submit.'}</p> : null}
      {beforeSubmit}
      <div>
        <Button fullWidth={false} loading={pending} disabled={!canSubmit} onClick={onSubmit}>
          {revisionOf ? 'Submit revision' : 'Submit Content'}
        </Button>
      </div>
    </div>
  );
}

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; name: string; progress: number }
  | { phase: 'done'; name: string }
  | { phase: 'error'; message: string };

/**
 * Chooses a video and uploads it straight to storage with live progress (contract §1.3,
 * "upload or link"). Reports the stored URL once the server has confirmed it arrived.
 */
function VideoUploadField({
  onUploaded,
  onUploadingChange,
}: {
  onUploaded: (url: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const api = useApi();
  const [state, setState] = useState<UploadState>({ phase: 'idle' });

  async function onFile(file: File | undefined) {
    if (!file) return;
    onUploaded(null);
    onUploadingChange?.(true);
    setState({ phase: 'uploading', name: file.name, progress: 0 });
    try {
      const uploaded = await uploadVideo(api, file, (progress) =>
        setState({ phase: 'uploading', name: file.name, progress }),
      );
      setState({ phase: 'done', name: file.name });
      onUploaded(uploaded.url);
    } catch (error) {
      setState({ phase: 'error', message: error instanceof Error ? error.message : String(error) });
    } finally {
      onUploadingChange?.(false);
    }
  }

  const percent = state.phase === 'uploading' ? Math.round(state.progress * 100) : 0;
  return (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface-raised p-6 text-center">
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="sr-only"
        disabled={state.phase === 'uploading'}
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      {state.phase === 'uploading' ? (
        <>
          <span className="text-sm text-text">{state.name}</span>
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <span className="block h-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
          </span>
          <span className="text-xs text-text-muted">{percent >= 100 ? 'Finishing…' : `Uploading… ${percent}%`}</span>
        </>
      ) : state.phase === 'done' ? (
        <>
          <span className="text-sm text-text">{state.name}</span>
          <span className="text-xs text-green-text">Uploaded · click to choose a different video</span>
        </>
      ) : (
        <>
          <span className="text-sm text-green-text">+ Choose a video to upload</span>
          <span className="text-xs text-text-muted">MP4, MOV or WebM, up to 500 MB</span>
          {state.phase === 'error' ? <span className="text-xs text-danger">{state.message}</span> : null}
        </>
      )}
    </label>
  );
}
