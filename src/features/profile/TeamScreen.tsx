'use client';

import { useState } from 'react';

import { AsyncContent, Avatar, Badge, Button, Card, Field, SegmentedToggle, useConfirm } from '@/design-system';
import type { TeamMember, TeamRole } from '@/shared/api';
import { useAuthStore } from '@/shared/auth';
import { DetailShell } from '@/shared/shell';

import { useBrandProfile, useInviteTeamMember, useRemoveTeamMember, useUpdateTeamMemberRole } from './hooks';

const ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: 'Member', label: 'Member' },
  { value: 'Owner', label: 'Owner' },
];

/**
 * Brand team (contract §1.2, "team member setup"): everyone with access, and — for
 * owners — inviting by email, changing roles and removing people.
 */
export function TeamScreen() {
  const profile = useBrandProfile();
  const userId = useAuthStore((state) => state.session?.userId);

  return (
    <DetailShell role="brand" title="Team" subtitle="People with access to this organization.">
      <AsyncContent isLoading={profile.isLoading} isError={profile.isError} data={profile.data}>
        {(data) => {
          const isOwner = data.teamMembers.some((member) => member.userId === userId && member.role === 'Owner');
          return (
            <div className="flex flex-col gap-4">
              {isOwner ? <InviteCard /> : null}
              <Card className="flex flex-col divide-y divide-border px-5 py-0">
                {data.teamMembers.map((member) => (
                  <TeamRow key={member.id} member={member} isYou={member.userId === userId} canManage={isOwner} />
                ))}
              </Card>
              {!isOwner ? <p className="text-xs text-text-muted">Only an owner can invite people or change roles.</p> : null}
            </div>
          );
        }}
      </AsyncContent>
    </DetailShell>
  );
}

function InviteCard() {
  const invite = useInviteTeamMember();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('Member');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="font-display text-base font-semibold text-text">Invite a teammate</p>
        <p className="text-xs text-text-muted">They get an email and can sign in with that address straight away.</p>
      </div>
      <Field
        type="email"
        placeholder="teammate@company.com"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setSentTo(null);
        }}
        aria-label="Teammate email"
      />
      <div className="max-w-xs">
        <SegmentedToggle options={ROLE_OPTIONS} value={role} onChange={setRole} ariaLabel="Role" />
      </div>
      <p className="text-xs text-text-muted">
        {role === 'Owner'
          ? 'Owners can also manage the team and billing.'
          : 'Members can run campaigns, review submissions and fund campaigns.'}
      </p>
      {invite.error ? (
        <p className="text-xs text-danger">
          {invite.error instanceof Error ? invite.error.message : 'Could not add this teammate.'}
        </p>
      ) : null}
      {sentTo ? <p className="text-xs text-green-text">{sentTo} was added and emailed.</p> : null}
      <div>
        <Button
          fullWidth={false}
          loading={invite.isPending}
          disabled={!valid || invite.isPending}
          onClick={() =>
            invite.mutate(
              { email: email.trim(), role },
              {
                onSuccess: () => {
                  setSentTo(email.trim());
                  setEmail('');
                },
              },
            )
          }
        >
          Send invite
        </Button>
      </div>
    </Card>
  );
}

function TeamRow({ member, isYou, canManage }: { member: TeamMember; isYou: boolean; canManage: boolean }) {
  const confirm = useConfirm();
  const updateRole = useUpdateTeamMemberRole();
  const remove = useRemoveTeamMember();
  const nextRole: TeamRole = member.role === 'Owner' ? 'Member' : 'Owner';
  const error = updateRole.error ?? remove.error;

  async function confirmRemove() {
    const ok = await confirm({
      title: isYou ? 'Leave this team?' : `Remove ${member.name}?`,
      message: isYou
        ? 'You will lose access to this organization.'
        : `${member.email || member.name} will lose access to this organization.`,
      confirmLabel: isYou ? 'Leave' : 'Remove',
      tone: 'danger',
    });
    if (ok) remove.mutate(member.id);
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center gap-3">
        <Avatar name={member.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] text-text">
            {member.name}
            {isYou ? ' (you)' : ''}
          </p>
          <p className="truncate text-xs text-text-muted">{member.email}</p>
        </div>
        <Badge tone={member.role === 'Owner' ? 'success' : 'neutral'}>{member.role}</Badge>
      </div>
      {canManage ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            fullWidth={false}
            loading={updateRole.isPending}
            onClick={() => updateRole.mutate({ memberId: member.id, role: nextRole })}
          >
            {nextRole === 'Owner' ? 'Make owner' : 'Make member'}
          </Button>
          <Button size="sm" variant="secondary" fullWidth={false} loading={remove.isPending} onClick={() => void confirmRemove()}>
            {isYou ? 'Leave' : 'Remove'}
          </Button>
        </div>
      ) : null}
      {error ? (
        <p className="text-xs text-danger">{error instanceof Error ? error.message : 'Could not update this teammate.'}</p>
      ) : null}
    </div>
  );
}
