'use client';

import { AsyncContent, Badge, Button, Divider } from '@/design-system';
import { DetailShell } from '@/shared/shell';

import { useConnectSocial, useCreatorProfile, useStartPlatformConnection } from './hooks';
import { SocialPlatformIcon } from './SocialPlatformIcon';
import { SOCIAL_PLATFORMS } from './socialPlatforms';

/** Instagram and TikTok are authorised on the platform itself; the rest take a handle. */
const OAUTH_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'snapchat'] as const;

function isOAuthPlatform(platform: string): platform is (typeof OAUTH_PLATFORMS)[number] {
  return (OAUTH_PLATFORMS as readonly string[]).includes(platform);
}

/**
 * The social accounts a brand can verify a creator's content against. Connecting
 * is one tap per platform and cannot be undone here — a creator disconnects by
 * revoking access with the platform itself.
 */
export function ConnectedAccountsScreen() {
  const profile = useCreatorProfile();
  const connect = useConnectSocial();
  const startConnection = useStartPlatformConnection();

  return (
    <DetailShell
      role="creator"
      title="Connected Accounts"
      subtitle="Link your social accounts so brands can verify your content."
    >
      <AsyncContent isLoading={profile.isLoading} isError={profile.isError} data={profile.data}>
        {(data) => (
          <div className="flex flex-col">
            {SOCIAL_PLATFORMS.map((account, index) => {
              const linked = data.socialAccounts.find(
                (item) => item.platform === account.platform && item.connected,
              );
              const oauth = isOAuthPlatform(account.platform);
              // A handle typed in is only a claim; signing in to the platform verifies it.
              const settled = linked && (linked.verified || !oauth);
              const anyPending = connect.isPending || startConnection.isPending;
              // Only the clicked row spins; the others are held until it finishes.
              const pending =
                (connect.isPending && connect.variables === account.platform) ||
                (startConnection.isPending && startConnection.variables === account.platform);
              return (
                <div key={account.platform}>
                  <div className="flex min-h-[72px] items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <SocialPlatformIcon platform={account.platform} />
                      <p className="font-display text-base font-semibold text-text">{account.label}</p>
                    </div>
                    {settled ? (
                      <Badge tone="success">{linked.verified ? 'Verified' : 'Connected'}</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth={false}
                        loading={pending}
                        disabled={anyPending && !pending}
                        onClick={() =>
                          isOAuthPlatform(account.platform)
                            ? startConnection.mutate(account.platform)
                            : connect.mutate(account.platform)
                        }
                      >
                        {linked ? 'Verify' : 'Connect'}
                      </Button>
                    )}
                  </div>
                  {index < SOCIAL_PLATFORMS.length - 1 ? <Divider /> : null}
                </div>
              );
            })}
            {startConnection.error ? (
              <p className="pt-3 text-xs text-danger">
                {startConnection.error instanceof Error
                  ? startConnection.error.message
                  : 'Could not start the connection.'}
              </p>
            ) : null}
          </div>
        )}
      </AsyncContent>
    </DetailShell>
  );
}
