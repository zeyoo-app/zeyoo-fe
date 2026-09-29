'use client';

import { AsyncContent, Avatar, Badge, Card } from '@/design-system';
import type { TeamMember } from '@/shared/api';
import { DetailShell } from '@/shared/shell';

import { useBrandProfile } from './hooks';

const ROLE_TONE = { Owner: 'success', Admin: 'accent', Member: 'neutral' } as const;

/** Brand team: everyone with access to the organization. */
export function TeamScreen() {
  const profile = useBrandProfile();

  return (
    <DetailShell role="brand" title="Team" subtitle="People with access to this organization.">
      <AsyncContent
        isLoading={profile.isLoading}
        isError={profile.isError}
        data={profile.data}
      >
        {(data) => (
          <Card className="flex flex-col divide-y divide-border px-5 py-0">
            {data.teamMembers.map((member) => (
              <TeamRow key={member.id} member={member} />
            ))}
          </Card>
        )}
      </AsyncContent>
    </DetailShell>
  );
}

function TeamRow({ member }: { member: TeamMember }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar name={member.name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-text">{member.name}</p>
        <p className="truncate text-xs text-text-muted">{member.email}</p>
      </div>
      <Badge tone={ROLE_TONE[member.role]}>{member.role}</Badge>
    </div>
  );
}
