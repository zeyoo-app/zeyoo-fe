'use client';

import { Play } from 'lucide-react';

import { AsyncContent, Avatar, EmptyState } from '@/design-system';
import { DetailShell } from '@/shared/shell';
import { formatCount } from '@/shared/money/money';

import { useCampaign } from './hooks';
import { useCampaignSubmissions } from '../submissions/hooks';

/**
 * What other creators have posted for this campaign — inspiration, not
 * competition. Read-only, and deliberately without reward or status detail, so
 * a creator never sees another creator's payout while still getting a sense of
 * what a good entry looks like.
 */
export function CommunitySubmissionsScreen({ campaignId }: { campaignId: string }) {
  const campaign = useCampaign(campaignId);
  const submissions = useCampaignSubmissions(campaignId);

  return (
    <DetailShell title="Community Submissions" subtitle="See how other creators are approaching this campaign.">
      <AsyncContent
        isLoading={campaign.isLoading || submissions.isLoading}
        isError={campaign.isError || submissions.isError}
        data={submissions.data}
      >
        {(entries) => (
          <>
            {campaign.data ? (
              <p className="text-sm text-text-muted">
                {campaign.data.title} — {campaign.data.brandName}
              </p>
            ) : null}
            {entries.length === 0 ? (
              <EmptyState
                title="No submissions yet"
                description="Creator posts will appear here as they are submitted."
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-7">
                {entries.map((submission) => (
                  <figure key={submission.id} className="flex flex-col gap-3">
                    <div className="relative flex aspect-[0.78] items-center justify-center overflow-hidden rounded-[22px] bg-surface-raised">
                      <Play className="size-7 text-border" fill="currentColor" aria-hidden />
                      <span className="absolute bottom-3 start-3.5 rounded-full bg-[#737373] px-3 py-1.5 text-xs text-white">
                        {formatCount(submission.views)} views
                      </span>
                    </div>
                    <figcaption className="flex items-center gap-2.5">
                      <Avatar name={submission.creatorHandle} size={40} />
                      <span className="min-w-0 truncate text-[15px] text-text">{submission.creatorHandle}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </>
        )}
      </AsyncContent>
    </DetailShell>
  );
}
