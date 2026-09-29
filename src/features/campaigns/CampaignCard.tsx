import Link from 'next/link';

import type { Campaign } from '@/shared/api';
import { Badge } from '@/design-system';
import { formatRatePerThousandViews } from '@/shared/money/money';
import { platformLabel } from '@/shared/format/platform';

import { CampaignCover } from './CampaignCover';

/** A campaign summary card linking to its detail page for the given role. */
export function CampaignCard({ campaign, href }: { campaign: Campaign; href: string }) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-primary/40"
    >
      <CampaignCover platform={campaign.platform} className="h-36" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="neutral">{platformLabel(campaign.platform)}</Badge>
          <Badge tone="success" className="font-numeric">
            {formatRatePerThousandViews(campaign.ratePerThousandViews)}
          </Badge>
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold text-text">{campaign.title}</h3>
        <p className="mt-0.5 text-sm text-text-muted">{campaign.brandName}</p>
      </div>
    </Link>
  );
}
