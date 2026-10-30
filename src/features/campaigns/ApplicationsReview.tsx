'use client';

import { useState, type ReactNode } from 'react';
import { BadgeCheck, ChevronRight } from 'lucide-react';

import { Avatar, Badge, Button, Card, Modal } from '@/design-system';
import type { CampaignApplication } from '@/shared/api';
import { platformLabel } from '@/shared/format/platform';

import { useCampaignApplications, useReviewApplication } from '../submissions/hooks';
import { useCreatorPublicProfile } from './hooks';

const STATUS: Record<CampaignApplication['status'], { label: string; tone: 'neutral' | 'success' | 'danger' }> = {
  pending: { label: 'Pending', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
};

/**
 * Brand review of applications (contract §1.2): only approved creators can submit content.
 * A decision is made from the applicant's details, so approving and declining live in the
 * review dialog, not on the list.
 */
export function ApplicationsReview({ campaignId }: { campaignId: string }) {
  const applications = useCampaignApplications(campaignId);
  const [openId, setOpenId] = useState<string | null>(null);
  const list = (applications.data ?? []).filter((application) => application.status !== 'withdrawn');
  if (list.length === 0) return null;
  const pending = list.filter((application) => application.status === 'pending').length;
  const open = list.find((application) => application.id === openId) ?? null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-semibold text-text">
        Applications ({pending > 0 ? `${pending} to review` : list.length})
      </h2>
      <div className="flex flex-col gap-3">
        {list.map((application) => (
          <Card key={application.id} className="flex flex-col gap-3 p-4">
            <button
              type="button"
              onClick={() => setOpenId(application.id)}
              className="flex items-center gap-3 text-start transition-opacity hover:opacity-80"
              aria-label={`View ${application.creatorName}'s profile`}
            >
              <Avatar name={application.creatorName} src={application.creatorAvatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text">{application.creatorName}</p>
                <p className="truncate text-xs text-text-muted">
                  {application.creatorHandle}
                  {application.fromInvitation ? ' · invited' : ''}
                </p>
              </div>
              <Badge tone={STATUS[application.status].tone}>{STATUS[application.status].label}</Badge>
              <ChevronRight className="size-4 shrink-0 text-text-tertiary rtl:rotate-180" />
            </button>
            {application.message ? (
              <p className="line-clamp-2 text-sm text-text-muted">“{application.message}”</p>
            ) : null}
            {application.status === 'pending' ? (
              <Button size="sm" fullWidth={false} onClick={() => setOpenId(application.id)}>
                Review application
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
      <ApplicantDialog campaignId={campaignId} application={open} onClose={() => setOpenId(null)} />
    </section>
  );
}

/** The applicant's profile, accounts and Zeyoo track record, with the decision at the end. */
function ApplicantDialog({
  campaignId,
  application,
  onClose,
}: {
  campaignId: string;
  application: CampaignApplication | null;
  onClose: () => void;
}) {
  const profile = useCreatorPublicProfile(application?.creatorId ?? null);
  const review = useReviewApplication();

  const decide = (approve: boolean) => {
    if (!application) return;
    review.mutate({ campaignId, applicationId: application.id, approve }, { onSuccess: onClose });
  };

  return (
    <Modal open={application !== null} onClose={onClose} title="Applicant">
      {application ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={application.creatorName} src={application.creatorAvatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-display text-lg font-semibold text-text">
                <span className="truncate">{application.creatorName}</span>
                {profile.data?.verified ? (
                  <BadgeCheck className="size-5 shrink-0 text-green-text" aria-label="Verified creator" />
                ) : null}
              </p>
              <p className="text-sm text-text-muted">
                {application.creatorHandle}
                {application.fromInvitation ? ' · invited by you' : ''}
              </p>
            </div>
          </div>

          {application.message ? (
            <Detail title="Their message">
              <p className="text-sm text-text">“{application.message}”</p>
            </Detail>
          ) : null}

          {profile.isLoading ? <p className="text-sm text-text-muted">Loading profile…</p> : null}
          {profile.isError ? <p className="text-sm text-danger">Could not load this creator&apos;s profile.</p> : null}
          {profile.data ? (
            <>
              {profile.data.headline || profile.data.bio || profile.data.country ? (
                <Detail title="About">
                  {profile.data.headline ? <p className="font-medium text-text">{profile.data.headline}</p> : null}
                  {profile.data.bio ? <p className="text-sm text-text-muted">{profile.data.bio}</p> : null}
                  {profile.data.country ? (
                    <p className="text-xs text-text-tertiary">Based in {countryName(profile.data.country)}</p>
                  ) : null}
                </Detail>
              ) : null}

              <Detail title="Social accounts">
                {profile.data.accounts.length === 0 ? (
                  <p className="text-sm text-text-muted">No accounts connected yet.</p>
                ) : (
                  profile.data.accounts.map((account) => (
                    <div key={account.platform} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-text">
                        {platformLabel(account.platform)} · {account.handle}
                      </span>
                      <Badge tone={account.verified ? 'success' : 'neutral'}>
                        {account.verified ? 'Verified' : 'Not verified'}
                      </Badge>
                    </div>
                  ))
                )}
              </Detail>

              <Detail title="On Zeyoo">
                <div className="flex gap-8">
                  <Stat value={profile.data.trackRecord.campaignsJoined} label="campaigns joined" />
                  <Stat value={profile.data.trackRecord.approvedSubmissions} label="posts approved" />
                </div>
                <p className="text-xs text-text-tertiary">
                  Member since{' '}
                  {new Date(profile.data.trackRecord.memberSince).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </Detail>
            </>
          ) : null}

          {review.error ? (
            <p className="text-xs text-danger">
              {review.error instanceof Error ? review.error.message : 'Could not update the application.'}
            </p>
          ) : null}
          {application.status === 'pending' ? (
            <div className="flex gap-2">
              <Button
                loading={review.isPending && review.variables?.approve}
                disabled={review.isPending}
                onClick={() => decide(true)}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                loading={review.isPending && !review.variables?.approve}
                disabled={review.isPending}
                onClick={() => decide(false)}
              >
                Decline
              </Button>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              You {application.status === 'approved' ? 'approved' : 'declined'} this application.
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

function Detail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{title}</p>
      {children}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-mono text-2xl text-text">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

/** "SA" → "Saudi Arabia" in the browser's language; the code itself if unknown. */
function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(undefined, { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
