'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, ChevronDown, MailPlus, Search, SlidersHorizontal } from 'lucide-react';

import {
  AsyncContent,
  Avatar,
  Button,
  Card,
  ChoiceChips,
  Field,
  Modal,
  PageHeader,
  Switch,
  type Choice,
} from '@/design-system';
import type { CampaignInvitation, CreatorDirectoryEntry, SocialPlatform } from '@/shared/api';

import { SocialPlatformIcon } from '../profile/SocialPlatformIcon';
import {
  useBrandCampaigns,
  useCampaignInvitations,
  useCreatorDirectory,
  useInviteCreator,
  useRevokeInvitation,
} from './hooks';

type PlatformFilter = 'any' | SocialPlatform;

const PLATFORM_FILTERS: Choice<PlatformFilter>[] = [
  { value: 'any', label: 'All platforms' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'snapchat', label: 'Snapchat' },
];

const STATUS_LABEL: Record<CampaignInvitation['status'], string> = {
  pending: 'Invited',
  accepted: 'Joined',
  declined: 'Declined',
  revoked: 'Withdrawn',
};

type Panel = 'email' | 'filters' | 'campaign' | 'pending';

/**
 * Brand-side creator discovery, built around one job: find a creator and invite them.
 * The page is the target campaign, a search with a filter button, and the list; email
 * invites, filters, the campaign switch and pending invitations open in dialogs.
 */
export function CreatorDirectoryScreen() {
  const requestedCampaignId = useSearchParams().get('campaign') ?? undefined;
  const [query, setQuery] = useState('');
  const [pickedCampaignId, setPickedCampaignId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('any');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);

  const directory = useCreatorDirectory({
    platform: platformFilter === 'any' ? undefined : platformFilter,
    verifiedOnly,
  });
  const campaigns = useBrandCampaigns();
  const liveCampaigns = useMemo(
    () => (campaigns.data ?? []).filter((campaign) => campaign.status === 'live'),
    [campaigns.data],
  );
  const campaignId = pickedCampaignId ?? requestedCampaignId ?? liveCampaigns[0]?.id;
  const campaign = liveCampaigns.find((item) => item.id === campaignId);
  const invitations = useCampaignInvitations(campaignId);
  const invite = useInviteCreator(campaignId);
  const revoke = useRevokeInvitation(campaignId);

  const invitationByCreator = useMemo(
    () => new Map((invitations.data ?? []).map((item) => [item.creatorId, item])),
    [invitations.data],
  );
  const pending = (invitations.data ?? []).filter((item) => item.status === 'pending');
  const activeFilters = (platformFilter === 'any' ? 0 : 1) + (verifiedOnly ? 1 : 0);

  return (
    <>
      <PageHeader
        title="Find creators"
        action={
          campaignId ? (
            <button
              type="button"
              onClick={() => setPanel('email')}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 text-sm font-medium text-green-text hover:bg-primary/20"
            >
              <MailPlus className="size-4" aria-hidden /> Email invite
            </button>
          ) : null
        }
      />

      <AsyncContent isLoading={campaigns.isLoading} isError={campaigns.isError} data={campaigns.data}>
        {() =>
          liveCampaigns.length === 0 ? (
            <Card className="p-5 text-sm text-text-muted">Publish a campaign first, then invite creators to it.</Card>
          ) : (
            <div className="flex min-w-0 items-center justify-between gap-3">
              <button
                type="button"
                disabled={liveCampaigns.length < 2}
                onClick={() => setPanel('campaign')}
                className="flex min-w-0 items-center gap-1.5 text-start disabled:cursor-default"
                aria-label="Change the campaign you are inviting to"
              >
                <span className="shrink-0 text-xs text-text-muted">Inviting to</span>
                <span className="truncate text-sm font-medium text-text">{campaign?.title ?? 'Choose a campaign'}</span>
                {liveCampaigns.length > 1 ? <ChevronDown className="size-4 shrink-0 text-text-muted" aria-hidden /> : null}
              </button>
              {pending.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setPanel('pending')}
                  className="shrink-0 text-xs font-medium text-green-text hover:underline"
                >
                  {pending.length} waiting
                </button>
              ) : null}
            </div>
          )
        }
      </AsyncContent>

      {campaignId ? (
        <div className="mt-4 flex min-w-0 flex-col gap-4">
          <div className="flex items-center gap-2">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface-raised px-3.5">
              <Search className="size-4 shrink-0 text-text-muted" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search creators"
                aria-label="Search creators"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-text placeholder:text-text-tertiary focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => setPanel('filters')}
              aria-label="Filters"
              className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised text-text hover:bg-surface-hover"
            >
              <SlidersHorizontal className="size-5" aria-hidden />
              {activeFilters > 0 ? (
                <span className="absolute -end-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-on-primary">
                  {activeFilters}
                </span>
              ) : null}
            </button>
          </div>

          {invite.error && panel !== 'email' ? (
            <p className="text-xs text-danger">
              {invite.error instanceof Error ? invite.error.message : 'Could not send the invite.'}
            </p>
          ) : null}

          <AsyncContent isLoading={directory.isLoading} isError={directory.isError} data={directory.data}>
            {(creators) => {
              const term = query.trim().toLowerCase();
              const results = creators.filter(
                (creator) => !term || `${creator.displayName} ${creator.handle}`.toLowerCase().includes(term),
              );
              return results.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No creators found. {activeFilters > 0 ? 'Try clearing the filters.' : 'Try a different name or handle.'}
                </p>
              ) : (
                <Card className="flex min-w-0 flex-col divide-y divide-border px-4 py-0">
                  {results.map((creator) => (
                    <CreatorRow
                      key={creator.id}
                      creator={creator}
                      invitation={invitationByCreator.get(creator.id)}
                      isBusy={invite.isPending && invite.variables?.creatorId === creator.id}
                      onInvite={() => invite.mutate({ creatorId: creator.id })}
                    />
                  ))}
                </Card>
              );
            }}
          </AsyncContent>
        </div>
      ) : null}

      <EmailInviteDialog
        open={panel === 'email'}
        campaignTitle={campaign?.title}
        isPending={invite.isPending && invite.variables?.email !== undefined}
        error={invite.error instanceof Error ? invite.error.message : null}
        onClose={() => setPanel(null)}
        onSend={(email) => invite.mutate({ email }, { onSuccess: () => setPanel(null) })}
      />

      <Modal open={panel === 'filters'} onClose={() => setPanel(null)} title="Filters">
        <p className="text-sm font-medium text-text">Platform</p>
        <ChoiceChips<PlatformFilter>
          accessibilityLabel="Filter by platform"
          choices={PLATFORM_FILTERS}
          value={platformFilter}
          onChange={setPlatformFilter}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-text">Verified creators only</span>
          <Switch checked={verifiedOnly} onChange={setVerifiedOnly} label="Verified creators only" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            disabled={activeFilters === 0}
            onClick={() => {
              setPlatformFilter('any');
              setVerifiedOnly(false);
            }}
          >
            Clear
          </Button>
          <Button onClick={() => setPanel(null)}>Show results</Button>
        </div>
      </Modal>

      <Modal open={panel === 'campaign'} onClose={() => setPanel(null)} title="Invite to">
        <ChoiceChips
          accessibilityLabel="Campaign to invite to"
          choices={liveCampaigns.map((item) => ({ value: item.id, label: item.title }))}
          value={campaignId ?? null}
          onChange={(value) => {
            setPickedCampaignId(value);
            setPanel(null);
          }}
        />
      </Modal>

      <Modal open={panel === 'pending'} onClose={() => setPanel(null)} title="Waiting to respond">
        {pending.length === 0 ? <p className="text-sm text-text-muted">No invitations are waiting.</p> : null}
        {pending.map((item) => (
          <div key={item.id} className="flex min-w-0 items-center gap-3">
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
          </div>
        ))}
      </Modal>
    </>
  );
}

/** One compact line per creator: who they are, where they post, and the invite action. */
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
  // A withdrawn or declined invitation cannot be re-sent (one invitation per creator).
  const settled = invitation !== undefined;
  return (
    <div className="flex min-w-0 items-center gap-3 py-3">
      <Avatar name={creator.displayName} src={creator.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1">
          <span className="truncate text-[15px] font-medium text-text">{creator.displayName}</span>
          {creator.verified ? <BadgeCheck className="size-4 shrink-0 text-green-text" aria-label="Verified" /> : null}
        </p>
        <p className="truncate text-xs text-text-muted">{creator.handle}</p>
        {creator.platforms.length > 0 ? (
          <div className="mt-1 flex gap-1">
            {[...new Set(creator.platforms)].map((platform) => (
              <SocialPlatformIcon key={platform} platform={platform} size={18} />
            ))}
          </div>
        ) : null}
      </div>
      <Button
        size="sm"
        variant={settled ? 'secondary' : 'primary'}
        fullWidth={false}
        className="shrink-0"
        disabled={settled}
        loading={isBusy}
        onClick={onInvite}
      >
        {invitation ? STATUS_LABEL[invitation.status] : 'Invite'}
      </Button>
    </div>
  );
}

function EmailInviteDialog({
  open,
  campaignTitle,
  isPending,
  error,
  onClose,
  onSend,
}: {
  open: boolean;
  campaignTitle?: string;
  isPending: boolean;
  error: string | null;
  onClose: () => void;
  onSend: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());
  return (
    <Modal open={open} onClose={onClose} title="Invite by email">
      <p className="text-sm text-text-muted">
        {campaignTitle
          ? `Invite a creator who already has a Zeyoo account to "${campaignTitle.replace(/[.\s]+$/, '')}".`
          : 'Invite a creator who already has a Zeyoo account.'}
      </p>
      <Field
        type="email"
        placeholder="creator@email.com"
        aria-label="Creator email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <Button
        disabled={!valid || isPending}
        loading={isPending}
        onClick={() => {
          onSend(email.trim());
          setEmail('');
        }}
      >
        Send invite
      </Button>
    </Modal>
  );
}
