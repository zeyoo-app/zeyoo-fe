'use client';

import { AsyncContent, Avatar, Button, Card, PageHeader } from '@/design-system';
import type { CreatorDirectoryEntry } from '@/shared/api';
import { formatCount } from '@/shared/money/money';

import { useCreatorDirectory, useInviteCreator } from './hooks';

export function CreatorDirectoryScreen() {
  const query = useCreatorDirectory();

  return (
    <>
      <PageHeader title="Find creators" subtitle="Invite creators to your campaigns." />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(creators) => (
          <div className="flex flex-col gap-3">
            {creators.map((creator) => (
              <CreatorRow key={creator.id} creator={creator} />
            ))}
          </div>
        )}
      </AsyncContent>
    </>
  );
}

function CreatorRow({ creator }: { creator: CreatorDirectoryEntry }) {
  const invite = useInviteCreator();

  return (
    <Card className="flex items-center gap-3 p-4">
      <Avatar name={creator.displayName} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text">{creator.displayName}</p>
        <p className="truncate text-xs text-text-muted">
          {creator.handle} · {creator.categories.join(', ')}
        </p>
        <p className="mt-0.5 font-numeric text-xs text-text-muted">
          {formatCount(creator.followers)} followers · {formatCount(creator.averageViews)} avg views
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        fullWidth={false}
        disabled={invite.isSuccess}
        loading={invite.isPending}
        onClick={() => invite.mutate({ creatorId: creator.id, campaignId: 'summer-skincare' })}
      >
        {invite.isSuccess ? 'Invited' : 'Invite'}
      </Button>
    </Card>
  );
}
