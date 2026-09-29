'use client';

import { AsyncContent, Badge, Button, Divider } from '@/design-system';
import { DetailShell } from '@/shared/shell';

import { useConnectSocial, useCreatorProfile } from './hooks';
import { SOCIAL_PLATFORMS } from './socialPlatforms';

/**
 * The social accounts a brand can verify a creator's content against. Connecting
 * is one tap per platform and cannot be undone here — a creator disconnects by
 * revoking access with the platform itself.
 */
export function ConnectedAccountsScreen() {
  const profile = useCreatorProfile();
  const connect = useConnectSocial();

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
              const connected = data.socialAccounts.some(
                (item) => item.platform === account.platform && item.connected,
              );
              return (
                <div key={account.platform}>
                  <div className="flex min-h-[72px] items-center justify-between gap-3">
                    <p className="font-display text-base font-semibold text-text">{account.label}</p>
                    {connected ? (
                      <Badge tone="success">Connected</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth={false}
                        loading={connect.isPending}
                        onClick={() => connect.mutate(account.platform)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                  {index < SOCIAL_PLATFORMS.length - 1 ? <Divider /> : null}
                </div>
              );
            })}
          </div>
        )}
      </AsyncContent>
    </DetailShell>
  );
}
