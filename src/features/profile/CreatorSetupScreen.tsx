'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Field, ImageUpload, type PickedImage } from '@/design-system';
import { useApi } from '@/shared/api';
import { useAuthStore } from '@/shared/auth';
import { DetailShell } from '@/shared/shell';

/** First-run creator profile step between email verification and Discover. */
export function CreatorSetupScreen() {
  const api = useApi();
  const router = useRouter();
  const params = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const persistSession = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  // The name typed during sign-up travels in the query string; the session is the
  // fallback for anyone who lands here directly.
  const [displayName, setDisplayName] = useState(
    () => params.get('name') ?? session?.displayName ?? '',
  );
  const [username, setUsername] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedUsername = username.trim().replace(/^@/, '').toLowerCase();
  const usernameValid = /^[a-z0-9._]{2,30}$/.test(normalizedUsername);
  const valid = displayName.trim().length >= 2 && usernameValid;

  /**
   * Leaving onboarding is not "go back": the account already exists, so the
   * guard would bounce a plain history-pop straight back here. Signing out
   * first releases the half-onboarded session and returns to sign-up, where the
   * creator can change their mind or start again.
   */
  async function goBackToSignUp() {
    await signOut();
    router.replace('/sign-up');
  }

  async function continueToDiscover() {
    if (!valid || pending) return;
    setPending(true);
    setError(null);
    try {
      const session = await api.setupCreator({
        displayName: displayName.trim(),
        username: normalizedUsername,
        avatarUrl: photo?.url,
        platforms: [],
      });
      persistSession(session);
      router.replace('/creator/discover');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not set up your profile. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <DetailShell
      role="creator"
      eyebrow="Step 3 of 3"
      title="Set up your profile"
      subtitle="Let brands know who's creating."
      onBack={goBackToSignUp}
    >
      <ImageUpload
        value={photo}
        onChange={setPhoto}
        onError={setError}
        label="Add profile photo"
        height={140}
      />
      <Field
        label="Display name"
        placeholder="e.g. Sara K."
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

      <p className="text-sm text-text-muted">
        You can connect Instagram, TikTok, YouTube and Snapchat later from Profile → Connected Accounts.
      </p>

      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <Button loading={pending} disabled={!valid || pending} onClick={continueToDiscover}>
        Continue
      </Button>
    </DetailShell>
  );
}
