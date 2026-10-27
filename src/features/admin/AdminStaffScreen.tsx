'use client';

import { useState } from 'react';

import { AsyncContent, Badge, Button, Card, Field, useConfirm } from '@/design-system';
import type { AdminStaff, StaffRole } from '@/shared/api';

import { AdminPageHeader, DataTable, type Column } from './DataTable';
import { formatDate } from './format';
import { useAddStaff, useAdminStaff, useSetStaffActive } from './hooks';

const ROLE_LABELS: Record<StaffRole, string> = { SUPER_ADMIN: 'Super admin' };

export function AdminStaffScreen() {
  const query = useAdminStaff();
  const add = useAddStaff();
  const setActive = useSetStaffActive();
  const confirm = useConfirm();
  const [email, setEmail] = useState('');

  const toggle = async (staff: AdminStaff) => {
    const deactivating = staff.status === 'ACTIVE';
    const confirmed = await confirm({
      title: deactivating ? 'Remove staff access?' : 'Restore staff access?',
      message: deactivating
        ? `${staff.email} will be signed out and can no longer sign in to the back office.`
        : `${staff.email} will be able to sign in to the back office again.`,
      confirmLabel: deactivating ? 'Remove access' : 'Restore access',
      tone: deactivating ? 'danger' : undefined,
    });
    if (confirmed) setActive.mutate({ staffId: staff.id, active: !deactivating });
  };

  const columns: Column<AdminStaff>[] = [
    {
      header: 'Staff member',
      cell: (staff) => (
        <span className="font-medium">
          {staff.email} {staff.isYou ? <span className="text-text-muted">(you)</span> : null}
        </span>
      ),
    },
    { header: 'Role', cell: (staff) => ROLE_LABELS[staff.role] },
    {
      header: 'Access',
      cell: (staff) => (
        <Badge tone={staff.status === 'ACTIVE' ? 'success' : 'danger'}>
          {staff.status === 'ACTIVE' ? 'Active' : 'Removed'}
        </Badge>
      ),
    },
    { header: 'Added', cell: (staff) => formatDate(staff.createdAt) },
    {
      header: 'Last sign-in',
      cell: (staff) => (staff.lastSignInAt ? formatDate(staff.lastSignInAt) : 'Never'),
    },
    {
      header: '',
      className: 'text-end',
      cell: (staff) =>
        staff.isYou ? null : (
          <Button
            size="sm"
            variant={staff.status === 'ACTIVE' ? 'danger' : 'secondary'}
            fullWidth={false}
            loading={setActive.isPending && setActive.variables?.staffId === staff.id}
            onClick={() => toggle(staff)}
          >
            {staff.status === 'ACTIVE' ? 'Remove access' : 'Restore access'}
          </Button>
        ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Staff"
        subtitle="Who can sign in to the back office. Everyone added is a super admin with full access, so add people carefully."
      />
      <Card className="mb-5 flex flex-col gap-3 p-4">
        <Field
          label="Add staff by email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <p className="text-xs text-text-muted">
          They sign in at /admin/sign-in with this email and a code sent to it. Staff accounts are separate from
          creator and brand accounts, so they need no app account.
        </p>
        {add.error ? (
          <p className="text-xs text-danger">
            {add.error instanceof Error ? add.error.message : 'Could not add this person.'}
          </p>
        ) : null}
        <Button
          size="sm"
          fullWidth={false}
          disabled={!email.includes('@')}
          loading={add.isPending}
          onClick={() => add.mutate(email.trim(), { onSuccess: () => setEmail('') })}
        >
          Give staff access
        </Button>
      </Card>
      {setActive.error ? (
        <p className="mb-3 text-sm text-danger">
          {setActive.error instanceof Error ? setActive.error.message : 'Could not change access.'}
        </p>
      ) : null}
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(staff) => (
          <DataTable columns={columns} rows={staff} rowKey={(row) => row.id} emptyTitle="No staff accounts" />
        )}
      </AsyncContent>
    </>
  );
}
