'use client';

import Link from 'next/link';

import { AsyncContent, Badge, Button, Card, useConfirm, type BadgeTone } from '@/design-system';
import type { AdminUserDetail } from '@/shared/api';
import { formatMoney } from '@/shared/money/money';
import { BackButton } from '@/shared/nav/BackButton';

import { formatDate, formatDateTime, formatMinor, formatTotals } from './format';
import { useAdminUserDetail, useSetUserSuspended } from './hooks';
import { USER_STATUS_TONE, USER_TYPE_LABEL } from './AdminUsersScreen';

const VERIFICATION: Record<
  NonNullable<AdminUserDetail['creator']>['verificationStatus'],
  { label: string; tone: BadgeTone }
> = {
  UNVERIFIED: { label: 'Not verified', tone: 'neutral' },
  PENDING: { label: 'Waiting for review', tone: 'warning' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  REJECTED: { label: 'Not approved', tone: 'danger' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-lg font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-0.5 text-sm text-text">{value}</p>
    </div>
  );
}

export function AdminUserDetailScreen({ userId }: { userId: string }) {
  const query = useAdminUserDetail(userId);
  const suspend = useSetUserSuspended();
  const confirm = useConfirm();

  return (
    <>
      <div className="mb-4">
        <BackButton />
      </div>
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(detail) => {
          const { user, creator } = detail;
          const who = creator?.displayName ?? detail.organizations[0]?.name ?? user.email ?? user.phone;
          const canSuspend =
            user.type !== 'ADMIN' && (user.status === 'ACTIVE' || user.status === 'SUSPENDED');
          const toggle = async () => {
            const suspending = user.status === 'ACTIVE';
            const confirmed = await confirm({
              title: suspending ? 'Suspend this account?' : 'Reactivate this account?',
              message: suspending
                ? `${who} will be unable to sign in until you reactivate them.`
                : `${who} will be able to sign in again.`,
              confirmLabel: suspending ? 'Suspend' : 'Reactivate',
              tone: suspending ? 'danger' : undefined,
            });
            if (confirmed) suspend.mutate({ userId: user.id, suspended: suspending });
          };
          return (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate font-display text-2xl font-semibold text-text">{who}</h1>
                  <p className="text-sm text-text-muted">{user.email ?? user.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{USER_TYPE_LABEL[user.type]}</Badge>
                  <Badge tone={USER_STATUS_TONE[user.status]}>{user.status.toLowerCase()}</Badge>
                  {canSuspend ? (
                    <Button
                      size="sm"
                      variant={user.status === 'ACTIVE' ? 'danger' : 'secondary'}
                      fullWidth={false}
                      loading={suspend.isPending}
                      onClick={toggle}
                    >
                      {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </Button>
                  ) : null}
                </div>
              </div>
              {suspend.error ? (
                <p className="text-sm text-danger">
                  {suspend.error instanceof Error ? suspend.error.message : 'Could not update the account.'}
                </p>
              ) : null}

              <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
                <Fact label="Joined" value={formatDate(user.createdAt)} />
                <Fact label="Contact verified" value={user.emailVerified ? 'Yes' : 'No'} />
                <Fact label="Role" value={USER_TYPE_LABEL[user.type]} />
                <Fact
                  label="Account ID"
                  value={<span className="break-all font-mono text-xs">{user.id}</span>}
                />
              </Card>

              {creator ? <CreatorSections creator={creator} /> : null}

              {detail.organizations.length > 0 ? (
                <Section title="Organizations">
                  <div className="flex flex-col gap-2">
                    {detail.organizations.map((org) => (
                      <Card key={org.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="font-medium text-text">{org.name}</p>
                          <p className="text-xs text-text-muted">
                            {org.role.toLowerCase()} · {org.campaignCount} campaigns · funded{' '}
                            {formatTotals(org.funded)}
                          </p>
                        </div>
                        <Badge tone={org.subscription?.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {org.subscription
                            ? `${org.subscription.planKey} · ${org.subscription.status.toLowerCase()}`
                            : 'No plan'}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </Section>
              ) : null}

              {detail.fraudCases.length > 0 ? (
                <Section title="Earnings reviews">
                  <div className="flex flex-col gap-2">
                    {detail.fraudCases.map((item) => (
                      <Card key={item.id} className="flex items-center justify-between gap-3 p-4">
                        <p className="text-sm text-text">
                          {item.campaignTitle} · {item.level.toLowerCase()} concern
                        </p>
                        <Badge tone={item.status === 'OPEN' ? 'warning' : 'neutral'}>
                          {item.status === 'OPEN'
                            ? 'Earnings paused'
                            : item.status === 'RESOLVED'
                              ? 'Confirmed'
                              : 'Cleared'}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </Section>
              ) : null}

              {detail.disputes.length > 0 ? (
                <Section title="Disputes opened">
                  <div className="flex flex-col gap-2">
                    {detail.disputes.map((item) => (
                      <Card key={item.id} className="flex flex-col gap-1 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-wide text-text-tertiary">
                            {item.subjectType.replace('_', ' ').toLowerCase()} · {formatDate(item.createdAt)}
                          </p>
                          <Badge
                            tone={
                              item.status === 'OPEN' || item.status === 'UNDER_REVIEW' ? 'warning' : 'neutral'
                            }
                          >
                            {item.status.replace('_', ' ').toLowerCase()}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 text-sm text-text-muted">{item.reason}</p>
                      </Card>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    Decide disputes from the{' '}
                    <Link href="/admin/disputes" className="underline">
                      Disputes
                    </Link>{' '}
                    queue.
                  </p>
                </Section>
              ) : null}
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
}

function CreatorSections({ creator }: { creator: NonNullable<AdminUserDetail['creator']> }) {
  const verification = VERIFICATION[creator.verificationStatus];
  return (
    <>
      <Section title="Creator profile">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-text">
              {creator.displayName} <span className="text-text-muted">@{creator.username}</span>
            </p>
            <Badge tone={verification.tone}>{verification.label}</Badge>
          </div>
          {creator.headline ? <p className="text-sm text-text-muted">{creator.headline}</p> : null}
          {creator.bio ? <p className="text-sm text-text">{creator.bio}</p> : null}
          {creator.verificationNote ? (
            <p className="text-sm text-warning">Last review note: {creator.verificationNote}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {creator.accounts.length === 0 ? (
              <span className="text-sm text-text-muted">No connected accounts.</span>
            ) : (
              creator.accounts.map((account) => (
                <Badge
                  key={`${account.platform}-${account.handle}`}
                  tone={account.verified ? 'success' : 'neutral'}
                >
                  {account.platform.toLowerCase()} @{account.handle}
                  {account.verified ? ' · verified' : ''}
                </Badge>
              ))
            )}
          </div>
          <p className="text-xs text-text-muted">
            {creator.country ? `Country ${creator.country} · ` : ''}
            Payout account {creator.payoutConnected ? 'connected' : 'not connected'} ·{' '}
            {creator.submissions.approved} of {creator.submissions.total} submissions approved
          </p>
        </Card>
      </Section>

      {creator.wallet ? (
        <Section title="Wallet">
          <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
            <Fact label="Available" value={formatMoney(creator.wallet.available)} />
            <Fact label="Pending withdrawal" value={formatMoney(creator.wallet.pending)} />
            <Fact label="On hold" value={formatMoney(creator.wallet.held)} />
            <Fact label="Lifetime earned" value={formatMoney(creator.wallet.lifetimeEarned)} />
          </Card>
        </Section>
      ) : null}

      {creator.earnings.length > 0 ? (
        <Section title="Earnings by campaign">
          <Card className="divide-y divide-border p-0">
            {creator.earnings.map((earning) => (
              <div key={earning.campaignTitle} className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="truncate text-sm text-text">{earning.campaignTitle}</p>
                <div className="flex items-center gap-2">
                  {earning.paused ? <Badge tone="warning">Paused</Badge> : null}
                  <span className="font-numeric text-sm text-text">
                    {formatMinor(earning.accruedMinor, earning.currencyCode)}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </Section>
      ) : null}

      {creator.withdrawals.length > 0 ? (
        <Section title="Recent withdrawals">
          <Card className="divide-y divide-border p-0">
            {creator.withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm text-text-muted">{formatDateTime(withdrawal.createdAt)}</p>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      withdrawal.status === 'PAID'
                        ? 'success'
                        : withdrawal.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {withdrawal.status.toLowerCase()}
                  </Badge>
                  <span className="font-numeric text-sm text-text">
                    {formatMinor(withdrawal.amountMinor, withdrawal.currencyCode)}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </Section>
      ) : null}
    </>
  );
}
