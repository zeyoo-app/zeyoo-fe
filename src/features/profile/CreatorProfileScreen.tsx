'use client';

import { useState } from 'react';

import { AsyncContent, Avatar, Badge, Button, Card, Field, Modal, PageHeader, Textarea } from '@/design-system';
import type { CreatorProfile, SocialAccount, SocialPlatform, VerificationStatus } from '@/shared/api';
import { formatCount } from '@/shared/money/money';

import { useConnectSocial, useCreatorProfile, useStartVerification, useUpdateProfile } from './hooks';

const VERIFICATION: Record<VerificationStatus, { label: string; tone: 'neutral' | 'warning' | 'success' }> = {
  unverified: { label: 'Not verified', tone: 'neutral' },
  pending: { label: 'Verification pending', tone: 'warning' },
  verified: { label: 'Verified', tone: 'success' },
};

const PLATFORM_NAME: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export function CreatorProfileScreen() {
  const query = useCreatorProfile();

  return (
    <>
      <PageHeader title="Profile" />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(profile) => <ProfileBody profile={profile} />}
      </AsyncContent>
    </>
  );
}

function ProfileBody({ profile }: { profile: CreatorProfile }) {
  const startVerification = useStartVerification();
  const [editing, setEditing] = useState(false);
  const verification = VERIFICATION[profile.verification];

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex items-center gap-4">
        <Avatar name={profile.displayName} size={56} />
        <div>
          <p className="font-display text-lg font-semibold text-text">{profile.displayName}</p>
          <p className="text-sm text-text-muted">Creator account</p>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <p className="font-display text-base font-semibold text-text">{profile.handle}</p>
          <Button size="sm" variant="ghost" fullWidth={false} onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
        <p className="mt-1 text-sm text-text-muted">{profile.bio}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.categories.map((category) => (
            <Badge key={category} tone="neutral">{category}</Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium text-text">Identity verification</p>
            <Badge tone={verification.tone} className="mt-1">{verification.label}</Badge>
          </div>
          {profile.verification === 'unverified' ? (
            <Button size="sm" fullWidth={false} loading={startVerification.isPending} onClick={() => startVerification.mutate()}>
              Verify
            </Button>
          ) : null}
        </div>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-text">Social accounts</h2>
        <Card className="flex flex-col gap-4">
          {profile.socialAccounts.map((account) => (
            <SocialRow key={account.platform} account={account} />
          ))}
        </Card>
      </div>

      <EditProfileModal open={editing} onClose={() => setEditing(false)} profile={profile} />
    </div>
  );
}

function SocialRow({ account }: { account: SocialAccount }) {
  const connect = useConnectSocial();
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text">{PLATFORM_NAME[account.platform]}</p>
        <p className="text-xs text-text-muted">
          {account.connected ? `${account.handle} · ${formatCount(account.followers)} followers` : 'Not connected'}
        </p>
      </div>
      {account.connected ? (
        <Badge tone="success">Connected</Badge>
      ) : (
        <Button size="sm" variant="secondary" fullWidth={false} loading={connect.isPending} onClick={() => connect.mutate(account.platform)}>
          Connect
        </Button>
      )}
    </div>
  );
}

function EditProfileModal({ open, onClose, profile }: { open: boolean; onClose: () => void; profile: CreatorProfile }) {
  const update = useUpdateProfile();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <Field label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      <Textarea label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} />
      <Button
        loading={update.isPending}
        onClick={() =>
          update.mutate(
            { displayName, bio, categories: profile.categories },
            { onSuccess: onClose },
          )
        }
      >
        Save changes
      </Button>
    </Modal>
  );
}
