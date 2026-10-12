'use client';

import { useState } from 'react';
import Link from 'next/link';

import {
  AsyncContent,
  Badge,
  Button,
  ChoiceChips,
  Field,
  useConfirm,
  type BadgeTone,
  type Choice,
} from '@/design-system';
import type { AdminUser, AdminUserStatus, AdminUserType } from '@/shared/api';

import { AdminPageHeader, DataTable, Pager, type Column } from './DataTable';
import { formatDate } from './format';
import { useAdminUsers, useSetUserSuspended } from './hooks';

const TYPE_CHOICES: Choice<AdminUserType | 'ALL'>[] = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'CREATOR', label: 'Creators' },
  { value: 'BRAND_USER', label: 'Brands' },
  { value: 'ADMIN', label: 'Staff' },
];

const STATUS_CHOICES: Choice<AdminUserStatus | 'ALL'>[] = [
  { value: 'ALL', label: 'Any status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DELETED', label: 'Deleted' },
];

export const USER_TYPE_LABEL: Record<AdminUserType, string> = {
  CREATOR: 'Creator',
  BRAND_USER: 'Brand',
  ADMIN: 'Staff',
};
export const USER_STATUS_TONE: Record<AdminUserStatus, BadgeTone> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'danger',
  DELETED: 'neutral',
};

export function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<AdminUserType | 'ALL'>('ALL');
  const [status, setStatus] = useState<AdminUserStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const query = useAdminUsers({
    search: search.trim() || undefined,
    type: type === 'ALL' ? undefined : type,
    status: status === 'ALL' ? undefined : status,
    page,
  });
  const suspend = useSetUserSuspended();
  const confirm = useConfirm();

  const toggle = async (user: AdminUser) => {
    const suspending = user.status === 'ACTIVE';
    const who = user.email ?? user.phone ?? 'This person';
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

  const columns: Column<AdminUser>[] = [
    {
      header: 'Person',
      cell: (user) => (
        <div className="min-w-0">
          <Link
            href={`/admin/users/${user.id}`}
            className="block truncate font-medium underline-offset-2 hover:underline"
          >
            {user.displayName ?? user.organizationName ?? user.email ?? user.phone}
          </Link>
          <p className="truncate text-xs text-text-muted">{user.email ?? user.phone}</p>
        </div>
      ),
    },
    { header: 'Role', cell: (user) => USER_TYPE_LABEL[user.type] },
    { header: 'Organization', cell: (user) => user.organizationName ?? '—' },
    {
      header: 'Status',
      cell: (user) => <Badge tone={USER_STATUS_TONE[user.status]}>{user.status.toLowerCase()}</Badge>,
    },
    { header: 'Joined', cell: (user) => formatDate(user.createdAt) },
    {
      header: '',
      className: 'text-end',
      cell: (user) =>
        user.type !== 'ADMIN' && (user.status === 'ACTIVE' || user.status === 'SUSPENDED') ? (
          <Button
            size="sm"
            variant={user.status === 'ACTIVE' ? 'danger' : 'secondary'}
            fullWidth={false}
            loading={suspend.isPending && suspend.variables?.userId === user.id}
            onClick={() => toggle(user)}
          >
            {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
          </Button>
        ) : null,
    },
  ];

  const reset = (): void => setPage(1);

  return (
    <>
      <AdminPageHeader
        title="Users"
        subtitle="Every account on the platform. Open a person for their full picture. Staff are managed under Staff."
      />
      <div className="mb-4 flex flex-col gap-3">
        <Field
          label="Search"
          placeholder="Email or phone"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            reset();
          }}
        />
        <ChoiceChips
          accessibilityLabel="Role"
          choices={TYPE_CHOICES}
          value={type}
          onChange={(value) => {
            setType(value);
            reset();
          }}
        />
        <ChoiceChips
          accessibilityLabel="Status"
          choices={STATUS_CHOICES}
          value={status}
          onChange={(value) => {
            setStatus(value);
            reset();
          }}
        />
      </div>
      {suspend.error ? (
        <p className="mb-3 text-sm text-danger">
          {suspend.error instanceof Error ? suspend.error.message : 'Could not update the account.'}
        </p>
      ) : null}
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(result) => (
          <>
            <DataTable
              columns={columns}
              rows={result.items}
              rowKey={(user) => user.id}
              emptyTitle="No accounts match"
            />
            <Pager page={result.page} pageSize={result.pageSize} total={result.total} onPage={setPage} />
          </>
        )}
      </AsyncContent>
    </>
  );
}
