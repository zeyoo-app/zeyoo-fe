'use client';

import { AsyncContent, Avatar, Badge, Card, PageHeader } from '@/design-system';
import type { TeamMember } from '@/shared/api';

import { useBrandProfile } from './hooks';

const ROLE_TONE = { Owner: 'success', Admin: 'accent', Member: 'neutral' } as const;

export function BrandProfileScreen() {
  const query = useBrandProfile();

  return (
    <>
      <PageHeader title="Profile" />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(profile) => (
          <div className="flex flex-col gap-5">
            <Card className="flex items-center gap-4">
              <Avatar name={profile.organizationName} size={56} />
              <div>
                <p className="font-display text-lg font-semibold text-text">{profile.organizationName}</p>
                <p className="text-sm text-text-muted">Company account · {profile.plan} plan</p>
              </div>
            </Card>

            <div>
              <h2 className="mb-3 font-display text-lg font-semibold text-text">Team</h2>
              <Card className="flex flex-col gap-4">
                {profile.teamMembers.map((member) => (
                  <TeamRow key={member.id} member={member} />
                ))}
              </Card>
            </div>
          </div>
        )}
      </AsyncContent>
    </>
  );
}

function TeamRow({ member }: { member: TeamMember }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={member.name} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text">{member.name}</p>
        <p className="truncate text-xs text-text-muted">{member.email}</p>
      </div>
      <Badge tone={ROLE_TONE[member.role]}>{member.role}</Badge>
    </div>
  );
}
