'use client';

import { useRouter } from 'next/navigation';
import { Bell, Building2, CreditCard, Crown, FileText, LifeBuoy, Settings, Users } from 'lucide-react';

import {
  AsyncContent,
  Avatar,
  Button,
  Card,
  Divider,
  ListRow,
  PageHeader,
  useConfirm,
} from '@/design-system';
import { useAuthStore } from '@/shared/auth';

import { useBrandBilling } from '../earnings/hooks';

import { useBrandProfile } from './hooks';

/** Profile hub: brand identity, the account list, and sign-out pinned to the bottom. */
export function BrandProfileScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const confirm = useConfirm();
  const profile = useBrandProfile();
  const billing = useBrandBilling();

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
      <PageHeader title="Profile" />

      <div className="flex items-center gap-3.5">
        <Avatar name={session?.displayName ?? 'Z'} size={52} />
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold text-text">
            {session?.displayName ?? 'Zeyoo user'}
          </p>
          {session?.email ? <p className="truncate text-sm text-text-muted">{session.email}</p> : null}
        </div>
      </div>

      <AsyncContent
        isLoading={profile.isLoading || billing.isLoading}
        isError={profile.isError || billing.isError}
        data={profile.data}
      >
        {(data) => (
          <div className="mt-6">
            <Card className="flex flex-col px-5 py-0">
              <ListRow
                title="Business info"
                subtitle="Logo, website, and industry"
                leading={<RowIcon icon={Building2} />}
                onPress={() => router.push('/brand/business-info')}
              />
              <Divider />
              <ListRow
                title="Subscription"
                subtitle={billing.data ? `${billing.data.plan} tier` : undefined}
                leading={<RowIcon icon={Crown} />}
                onPress={() => router.push('/brand/subscription')}
              />
              <Divider />
              <ListRow
                title="Payment Method"
                subtitle={
                  billing.data?.paymentMethodLast4
                    ? `Visa •••• ${billing.data.paymentMethodLast4}`
                    : 'Add a card'
                }
                leading={<RowIcon icon={CreditCard} />}
                onPress={() => router.push('/brand/payment-method')}
              />
              <Divider />
              <ListRow
                title="Team"
                subtitle={`${data.teamMembers.length} members`}
                leading={<RowIcon icon={Users} />}
                onPress={() => router.push('/brand/team')}
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
                title="Notifications"
                subtitle="What Zeyoo sends you, and how often"
                leading={<RowIcon icon={Bell} />}
                onPress={() => router.push('/settings/notifications')}
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
                title="Help & support"
                subtitle="Get help or contact us"
                leading={<RowIcon icon={LifeBuoy} />}
                onPress={() => router.push('/settings/help')}
              />
            </Card>
          </div>
        )}
      </AsyncContent>

      <div className="mt-auto pt-6">
        <Button variant="secondary" onClick={onSignOut}>
          Sign out
        </Button>
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
