'use client';

import { useState } from 'react';

import { AsyncContent, Badge, Button, Card, Field, SelectInput, useConfirm } from '@/design-system';
import type { AdminStaff, StaffRole } from '@/shared/api';

import { AdminPageHeader, DataTable, type Column } from './DataTable';
import { formatDate } from './format';
import { useAddStaff, useAdminStaff, useSetStaffActive, useSetStaffRole } from './hooks';
import { STAFF_ROLE_LABEL, STAFF_ROLE_SUMMARY, STAFF_ROLES } from './staffAccess';

const ROLE_OPTIONS = STAFF_ROLES.map((role) => ({ value: role, label: STAFF_ROLE_LABEL[role] }));

export function AdminStaffScreen() {
  const query = useAdminStaff();
  const add = useAddStaff();
  const setActive = useSetStaffActive();
  const setRole = useSetStaffRole();
  const confirm = useConfirm();
  const [email, setEmail] = useState('');
  // Least access by default: a super admin is a deliberate choice.
  const [role, setNewRole] = useState<StaffRole>('SUPPORT');

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

  const changeRole = async (staff: AdminStaff, next: StaffRole) => {
    if (next === staff.role) return;
    const confirmed = await confirm({
      title: `Make ${staff.email} ${STAFF_ROLE_LABEL[next].toLowerCase()}?`,
      message: `${STAFF_ROLE_SUMMARY[next]} They're signed out and see the new access when they sign back in.`,
      confirmLabel: 'Change role',
    });
    if (confirmed) setRole.mutate({ staffId: staff.id, role: next });
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
    {
      header: 'Role',
      cell: (staff) =>
        // Your own role and removed accounts are shown, not edited.
        staff.isYou || staff.status !== 'ACTIVE' ? (
          STAFF_ROLE_LABEL[staff.role]
        ) : (
          <select
            aria-label={`Role for ${staff.email}`}
            value={staff.role}
            disabled={setRole.isPending}
            onChange={(event) => void changeRole(staff, event.target.value as StaffRole)}
            className="h-9 cursor-pointer rounded-lg border border-border bg-surface-raised px-2 text-sm text-text hover:bg-surface-hover focus:border-primary focus:outline-none"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ),
    },
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

  const actionError = setActive.error ?? setRole.error;

  return (
    <>
      <AdminPageHeader
        title="Staff"
        subtitle="Who can sign in to the back office, and what each person can open. Only super admins manage staff."
      />
      <Card className="mb-5 flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field
              label="Add staff by email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <SelectInput label="Role" className="sm:w-48" options={ROLE_OPTIONS} value={role} onChange={setNewRole} />
        </div>
        <p className="text-sm text-text">
          <span className="font-medium">{STAFF_ROLE_LABEL[role]}:</span>{' '}
          <span className="text-text-muted">{STAFF_ROLE_SUMMARY[role]}</span>
        </p>
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
          onClick={() => add.mutate({ email: email.trim(), role }, { onSuccess: () => setEmail('') })}
        >
          Give {STAFF_ROLE_LABEL[role].toLowerCase()} access
        </Button>
      </Card>
      {actionError ? (
        <p className="mb-3 text-sm text-danger">
          {actionError instanceof Error ? actionError.message : 'Could not change access.'}
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
