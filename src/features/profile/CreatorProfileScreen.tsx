'use client';

import { useRouter } from 'next/navigation';
import { Bell, CreditCard, FileText, LifeBuoy, Link2, Settings, UserPen } from 'lucide-react';

import {
  AsyncContent,
  Avatar,
  Card,
  Divider,
  ListRow,
  PageHeader,
  useConfirm,
} from '@/design-system';
import { useAuthStore } from '@/shared/auth';

import { useCreatorProfile } from './hooks';
import { VerificationCard } from './VerificationCard';
import { SOCIAL_PLATFORMS } from './socialPlatforms';
import { useDeleteAccount } from './useDeleteAccount';

/**
 * The creator's account hub, mirroring the brand profile: who you are at the
 * top, then the rows that change how you get paid, reach us, and stay in the
 * loop. Sign-out lives here as well as in the shell, because the mobile tab bar
 * has no room for it.
 */
export function CreatorProfileScreen() {
  const query = useCreatorProfile();

  return (
    <>
      <PageHeader title="Profile" />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(profile) => <ProfileBody displayName={profile.displayName} handle={profile.handle} avatarUrl={profile.avatarUrl} connectedCount={profile.socialAccounts.filter((account) => account.connected).length} />}
      </AsyncContent>
    </>
  );
}

function ProfileBody({
  displayName,
  handle,
  avatarUrl,
  connectedCount,
}: {
  displayName: string;
  handle: string;
  avatarUrl?: string;
  connectedCount: number;
}) {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const confirm = useConfirm();

  const deletion = useDeleteAccount();

  async function onSignOut() {
    const confirmed = await confirm({
      title: 'Sign out?',
      confirmLabel: 'Sign out',
      tone: 'danger',
    });
    if (!confirmed) return;
    signOut();
    router.replace('/sign-in');
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3.5">
        <Avatar name={displayName} src={avatarUrl} size={52} />
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold text-text">{displayName}</p>
          <p className="truncate text-sm text-text-muted">{handle}</p>
        </div>
      </div>

      <div className="mt-6">
        <VerificationCard />
      </div>

      <div className="mt-6">
        <Card className="flex flex-col px-5 py-0">
          <ListRow
            title="Edit profile"
            subtitle="Name, username, and photo"
            leading={<RowIcon icon={UserPen} />}
            onPress={() => router.push('/creator/edit-profile')}
          />
          <Divider />
          <ListRow
            title="Payout Method"
            subtitle="Where your earnings are sent"
            leading={<RowIcon icon={CreditCard} />}
            onPress={() => router.push('/creator/payout-method')}
          />
          <Divider />
          <ListRow
            title="Connected Accounts"
            subtitle={`${connectedCount} of ${SOCIAL_PLATFORMS.length} connected`}
            leading={<RowIcon icon={Link2} />}
            onPress={() => router.push('/creator/connected-accounts')}
          />
          <Divider />
          <ListRow
            title="Notifications"
            subtitle="What Zeyoo sends you, and how often"
            leading={<RowIcon icon={Bell} />}
            onPress={() => router.push('/settings/notifications')}
          />
          <Divider />
          <ListRow
            title="Disputes"
            subtitle="Appeals and problems you have raised"
            leading={<RowIcon icon={LifeBuoy} />}
            onPress={() => router.push('/disputes')}
          />
          <Divider />
          <ListRow
            title="Help & Support"
            subtitle="Get paid, withdrawals, and contact us"
            leading={<RowIcon icon={LifeBuoy} />}
            onPress={() => router.push('/settings/help')}
          />
          <Divider />
          <ListRow
            title="Settings"
            subtitle="Appearance and language"
            leading={<RowIcon icon={Settings} />}
            onPress={() => router.push('/settings')}
          />
          <Divider />
          <ListRow
            title="Legal & privacy"
            subtitle="Terms, privacy policy"
            leading={<RowIcon icon={FileText} />}
            onPress={() => router.push('/settings/legal')}
          />
          <Divider />
          <ListRow
            title="Campaign Rules"
            subtitle="What creators and brands agree to"
            leading={<RowIcon icon={FileText} />}
            onPress={() => router.push('/campaign-rules')}
          />
          <Divider />
          <ListRow title="Log Out" tone="danger" onPress={onSignOut} />
          <Divider />
          <ListRow title="Delete account" tone="danger" onPress={deletion.requestDeletion} />
          {deletion.error ? <p className="px-1 pb-3 text-xs text-danger">{deletion.error}</p> : null}
        </Card>
      </div>
    </div>
  );
}

function RowIcon({ icon: Icon }: { icon: typeof Settings }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised">
      <Icon className="size-[18px] text-text" aria-hidden />
    </span>
  );
}
