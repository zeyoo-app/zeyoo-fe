'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  AsyncContent,
  Avatar,
  Button,
  Card,
  ChoiceChips,
  Field,
  PageHeader,
  type Choice,
} from '@/design-system';
import type { CampaignInvitation, CreatorDirectoryEntry } from '@/shared/api';

import {
  useBrandCampaigns,
  useCampaignInvitations,
  useCreatorDirectory,
  useInviteCreator,
  useRevokeInvitation,
} from './hooks';

const STATUS_LABEL: Record<CampaignInvitation['status'], string> = {
  pending: 'Invited',
  accepted: 'Joined',
  declined: 'Declined',
  revoked: 'Invite withdrawn',
};

/**
 * Brand-side creator discovery. Invitations always belong to one live campaign, picked
 * at the top; each creator shows where their invitation to it stands, and pending
 * invitations can be withdrawn.
 */
export function CreatorDirectoryScreen() {
  const requestedCampaignId = useSearchParams().get('campaign') ?? undefined;
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [pickedCampaignId, setPickedCampaignId] = useState<string | null>(null);

  const directory = useCreatorDirectory();
  const campaigns = useBrandCampaigns();
  const liveCampaigns = useMemo(
    () => (campaigns.data ?? []).filter((campaign) => campaign.status === 'live'),
    [campaigns.data],
  );
  const campaignId = pickedCampaignId ?? requestedCampaignId ?? liveCampaigns[0]?.id;
  const invitations = useCampaignInvitations(campaignId);
  const invite = useInviteCreator(campaignId);
  const revoke = useRevokeInvitation(campaignId);

  const invitationByCreator = useMemo(
    () => new Map((invitations.data ?? []).map((item) => [item.creatorId, item])),
    [invitations.data],
  );
  const campaignChoices: Choice<string>[] = liveCampaigns.map((campaign) => ({
    value: campaign.id,
    label: campaign.title,
  }));
  const pending = (invitations.data ?? []).filter((item) => item.status === 'pending');

  const sendEmailInvite = () => {
    invite.mutate({ email: email.trim() }, { onSuccess: () => setEmail('') });
  };

  return (
    <>
      <PageHeader title="Find creators" subtitle="Invite creators to your campaigns." />

      <AsyncContent isLoading={campaigns.isLoading} isError={campaigns.isError} data={campaigns.data}>
        {() =>
          liveCampaigns.length === 0 ? (
            <Card className="p-5 text-sm text-text-muted">
              Publish a campaign first, then invite creators to it.
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-medium text-text-muted">Invite to</p>
              <ChoiceChips
                accessibilityLabel="Campaign to invite to"
                choices={campaignChoices}
                value={campaignId ?? null}
                onChange={setPickedCampaignId}
              />
            </div>
          )
        }
      </AsyncContent>

      {campaignId ? (
        <div className="mt-6 flex flex-col gap-6">
          <Card className="flex flex-col gap-3 p-4">
            <Field
              label="Invite by email"
              type="email"
              placeholder="creator@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button
              size="sm"
              fullWidth={false}
              disabled={!email.includes('@')}
              loading={invite.isPending && invite.variables?.email !== undefined}
              onClick={sendEmailInvite}
            >
              Send invite
            </Button>
            {invite.error ? (
              <p className="text-xs text-danger">
                {invite.error instanceof Error ? invite.error.message : 'Could not send the invite.'}
              </p>
            ) : null}
          </Card>

          {pending.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-lg font-semibold text-text">
                Waiting to respond ({pending.length})
              </h2>
              {pending.map((item) => (
                <Card key={item.id} className="flex items-center gap-3 p-3">
                  <Avatar name={item.name} src={item.avatarUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{item.name}</p>
                    <p className="truncate text-xs text-text-muted">{item.handle}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth={false}
                    loading={revoke.isPending && revoke.variables === item.id}
                    onClick={() => revoke.mutate(item.id)}
                  >
                    Withdraw
                  </Button>
                </Card>
              ))}
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <Field
              label="Search creators"
              placeholder="Name or handle"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <AsyncContent isLoading={directory.isLoading} isError={directory.isError} data={directory.data}>
              {(creators) => {
                const term = query.trim().toLowerCase();
                const results = creators.filter(
                  (creator) => !term || `${creator.displayName} ${creator.handle}`.toLowerCase().includes(term),
                );
                return results.length === 0 ? (
                  <p className="text-sm text-text-muted">No creators found.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {results.map((creator) => (
                      <CreatorRow
                        key={creator.id}
                        creator={creator}
                        invitation={invitationByCreator.get(creator.id)}
                        isBusy={invite.isPending && invite.variables?.creatorId === creator.id}
                        onInvite={() => invite.mutate({ creatorId: creator.id })}
                      />
                    ))}
                  </div>
                );
              }}
            </AsyncContent>
          </section>
        </div>
      ) : null}
    </>
  );
}

function CreatorRow({
  creator,
  invitation,
  isBusy,
  onInvite,
}: {
  creator: CreatorDirectoryEntry;
  invitation?: CampaignInvitation;
  isBusy: boolean;
  onInvite: () => void;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <Avatar name={creator.displayName} src={creator.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text">{creator.displayName}</p>
        <p className="truncate text-xs text-text-muted">{creator.handle}</p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        fullWidth={false}
        disabled={invitation !== undefined}
        loading={isBusy}
        onClick={onInvite}
      >
        {invitation ? STATUS_LABEL[invitation.status] : 'Invite'}
      </Button>
    </Card>
  );
}
