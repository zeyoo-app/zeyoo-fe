'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AsyncContent, Button, Field, ImageUpload, type PickedImage } from '@/design-system';
import type { CreatorProfile } from '@/shared/api';
import { DetailShell } from '@/shared/shell';

import { useCreatorProfile, useUpdateProfile } from './hooks';

/** Edit the creator's own name, username, and photo. */
export function EditCreatorProfileScreen() {
  const query = useCreatorProfile();

  return (
    <DetailShell role="creator" title="Edit profile" subtitle="How brands see you.">
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(profile) => <EditForm profile={profile} />}
      </AsyncContent>
    </DetailShell>
  );
}

function EditForm({ profile }: { profile: CreatorProfile }) {
  const router = useRouter();
  const update = useUpdateProfile();
  const [photo, setPhoto] = useState<PickedImage | null>(() =>
    profile.avatarUrl ? { previewUrl: profile.avatarUrl, url: profile.avatarUrl } : null,
  );
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [error, setError] = useState<string | null>(null);

  const normalizedUsername = username.trim().replace(/^@/, '').toLowerCase();
  const usernameValid = /^[a-z0-9._]{2,30}$/.test(normalizedUsername);
  const valid = displayName.trim().length >= 2 && usernameValid;

  async function save() {
    if (!valid || update.isPending) return;
    setError(null);
    try {
      await update.mutateAsync({
        displayName: displayName.trim(),
        username: normalizedUsername,
        avatarUrl: photo?.url,
      });
      router.back();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save your profile. Please try again.');
    }
  }

  return (
    <>
      <ImageUpload value={photo} onChange={setPhoto} onError={setError} label="Change profile photo" height={140} />
      <Field
        label="Display name"
        autoComplete="name"
        maxLength={80}
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
      />
      <Field
        label="Username"
        placeholder="@yourhandle"
        autoComplete="off"
        autoCapitalize="none"
        maxLength={31}
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        error={
          username.length > 0 && !usernameValid
            ? 'Use 2–30 letters, numbers, dots, or underscores.'
            : undefined
        }
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <Button loading={update.isPending} disabled={!valid || update.isPending} onClick={save}>
        Save changes
      </Button>
    </>
  );
}
