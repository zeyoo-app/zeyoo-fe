'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Field, ImageUpload, cn, type PickedImage } from '@/design-system';
import { useApi } from '@/shared/api';
import { useAuthStore } from '@/shared/auth';
import { DetailShell } from '@/shared/shell';

type SetupPlatform = 'instagram' | 'tiktok' | 'snapchat';

const PLATFORMS: { value: SetupPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'snapchat', label: 'Snapchat' },
];

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
  const [platforms, setPlatforms] = useState<SetupPlatform[]>(['instagram']);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedUsername = username.trim().replace(/^@/, '').toLowerCase();
  const usernameValid = /^[a-z0-9._]{2,30}$/.test(normalizedUsername);
  const valid = displayName.trim().length >= 2 && usernameValid && platforms.length > 0;

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

  function togglePlatform(platform: SetupPlatform) {
    setPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform],
    );
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
        platforms,
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

      <div className="flex flex-col gap-2.5">
        <p className="text-[15px] text-text-muted">Connect your accounts</p>
        <div role="group" aria-label="Social accounts to connect" className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => {
            const selected = platforms.includes(platform.value);
            return (
              <button
                key={platform.value}
                type="button"
                aria-pressed={selected}
                onClick={() => togglePlatform(platform.value)}
                className={cn(
                  'min-h-[34px] rounded-full border px-3 text-sm',
                  selected
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface-raised text-text-muted hover:bg-surface-hover',
                )}
              >
                {platform.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <Button loading={pending} disabled={!valid || pending} onClick={continueToDiscover}>
        Continue
      </Button>
    </DetailShell>
  );
}
