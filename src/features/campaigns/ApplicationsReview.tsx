'use client';

import { Avatar, Badge, Button, Card } from '@/design-system';
import type { CampaignApplication } from '@/shared/api';

import { useCampaignApplications, useReviewApplication } from '../submissions/hooks';

const STATUS: Record<CampaignApplication['status'], { label: string; tone: 'neutral' | 'success' | 'danger' }> = {
  pending: { label: 'Pending', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
};

/** Brand review of applications (contract §1.2): only approved creators can submit content. */
export function ApplicationsReview({ campaignId }: { campaignId: string }) {
  const applications = useCampaignApplications(campaignId);
  const review = useReviewApplication();
  const list = (applications.data ?? []).filter((application) => application.status !== 'withdrawn');
  if (list.length === 0) return null;
  const pending = list.filter((application) => application.status === 'pending').length;

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-semibold text-text">
        Applications ({pending > 0 ? `${pending} to review` : list.length})
      </h2>
      <div className="flex flex-col gap-3">
        {list.map((application) => {
          const busy = review.isPending && review.variables?.applicationId === application.id;
          return (
            <Card key={application.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={application.creatorName} src={application.creatorAvatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{application.creatorName}</p>
                  <p className="truncate text-xs text-text-muted">
                    {application.creatorHandle}
                    {application.fromInvitation ? ' · invited' : ''}
                  </p>
                </div>
                <Badge tone={STATUS[application.status].tone}>{STATUS[application.status].label}</Badge>
              </div>
              {application.message ? <p className="text-sm text-text-muted">“{application.message}”</p> : null}
              {application.status === 'pending' ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    fullWidth={false}
                    loading={busy && review.variables?.approve}
                    disabled={review.isPending}
                    onClick={() => review.mutate({ campaignId, applicationId: application.id, approve: true })}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth={false}
                    loading={busy && !review.variables?.approve}
                    disabled={review.isPending}
                    onClick={() => review.mutate({ campaignId, applicationId: application.id, approve: false })}
                  >
                    Decline
                  </Button>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
      {review.error ? (
        <p className="mt-2 text-xs text-danger">
          {review.error instanceof Error ? review.error.message : 'Could not update the application.'}
        </p>
      ) : null}
    </section>
  );
}
