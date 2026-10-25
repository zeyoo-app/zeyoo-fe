'use client';

import { useRouter } from 'next/navigation';

import { Button, Card } from '@/design-system';
import { platformLabel } from '@/shared/format/platform';

import { useDeclineInvitation, useMyInvitations } from '../submissions/hooks';

/**
 * Private-campaign invitations waiting for an answer (contract §1.3). Accepting opens the
 * campaign, where applying accepts its terms; declining tells the brand no.
 */
export function InvitationsSection() {
  const router = useRouter();
  const invitations = useMyInvitations();
  const decline = useDeclineInvitation();
  if (!invitations.data || invitations.data.length === 0) return null;

  return (
    <section className="mb-6 flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-text">Invitations ({invitations.data.length})</h2>
      {invitations.data.map((invitation) => {
        const declining = decline.isPending && decline.variables === invitation.id;
        return (
          <Card key={invitation.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-text-tertiary">
                Private · {platformLabel(invitation.platform)}
              </p>
              <p className="truncate font-medium text-text">{invitation.campaignTitle}</p>
              <p className="text-sm text-text-muted">You were invited to this campaign.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                fullWidth={false}
                disabled={decline.isPending}
                onClick={() => router.push(`/creator/campaigns/${invitation.campaignId}`)}
              >
                View & accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                fullWidth={false}
                loading={declining}
                disabled={decline.isPending && !declining}
                onClick={() => decline.mutate(invitation.id)}
              >
                Decline
              </Button>
            </div>
          </Card>
        );
      })}
      {decline.error ? (
        <p className="text-xs text-danger">
          {decline.error instanceof Error ? decline.error.message : 'Could not decline the invitation.'}
        </p>
      ) : null}
    </section>
  );
}
