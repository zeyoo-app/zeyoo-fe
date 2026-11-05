import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';

import { Badge, Card } from '@/design-system';
import type { Campaign } from '@/shared/api';

/**
 * What a campaign asks of creators, shown the same way to the brand that wrote it and
 * the creators who join it: the brief, requirements, goals and audience, and materials.
 */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 font-display text-lg font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

export function CampaignBriefSection({ campaign }: { campaign: Campaign }) {
  if (!campaign.brief.trim()) return null;
  return (
    <Section title="Brief">
      <Card>
        <p className="whitespace-pre-line text-sm leading-relaxed text-text">{campaign.brief}</p>
      </Card>
    </Section>
  );
}

export function CampaignRequirementsSection({ campaign }: { campaign: Campaign }) {
  const { hashtags, mentions, contentRules, disclosureRequired } = campaign.requirements;
  if (hashtags.length === 0 && mentions.length === 0 && contentRules.length === 0 && !disclosureRequired) {
    return null;
  }
  return (
    <Section title="Requirements">
      <Card className="flex flex-col gap-3">
        {hashtags.length || mentions.length ? (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <Badge key={tag} tone="accent">
                {tag}
              </Badge>
            ))}
            {mentions.map((mention) => (
              <Badge key={mention} tone="neutral">
                {mention}
              </Badge>
            ))}
          </div>
        ) : null}
        {contentRules.length > 0 ? (
          <ul className="flex list-disc flex-col gap-1 ps-5 text-sm text-text">
            {contentRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        ) : null}
        {disclosureRequired ? (
          <p className="text-sm text-text-muted">Ad disclosure required — label the post as a paid partnership.</p>
        ) : null}
      </Card>
    </Section>
  );
}

/** The brand's goals and target audience, when it gave them (contract §1.2). */
export function CampaignAboutSection({ campaign }: { campaign: Campaign }) {
  if (!campaign.goals && !campaign.audience) return null;
  return (
    <Section title="About this campaign">
      <Card className="flex flex-col gap-3">
        {campaign.goals ? (
          <div>
            <p className="text-sm font-medium text-text">Goals</p>
            <p className="text-sm text-text-muted">{campaign.goals}</p>
          </div>
        ) : null}
        {campaign.audience ? (
          <div>
            <p className="text-sm font-medium text-text">Audience</p>
            <p className="text-sm text-text-muted">{campaign.audience}</p>
          </div>
        ) : null}
      </Card>
    </Section>
  );
}

export function CampaignReferencesSection({ campaign }: { campaign: Campaign }) {
  if (campaign.referenceMaterials.length === 0) return null;
  return (
    <Section title="Reference materials">
      <Card className="flex flex-col gap-2">
        {campaign.referenceMaterials.map((material) => (
          <a
            key={material.id}
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 text-sm text-text hover:underline"
          >
            <span className="truncate">{material.name}</span>
            <ExternalLink className="size-4 shrink-0 text-text-muted" aria-hidden />
          </a>
        ))}
      </Card>
    </Section>
  );
}

/** When the campaign runs, and how long it has left while it is live. */
export function CampaignScheduleSection({ campaign }: { campaign: Campaign }) {
  if (!campaign.startDate && !campaign.endDate) return null;
  const daysLeft = campaign.endDate ? daysUntil(campaign.endDate) : null;
  return (
    <Section title="Schedule">
      <Card className="flex flex-col gap-2 text-sm">
        {campaign.startDate ? (
          <div className="flex justify-between">
            <span className="text-text-muted">Starts</span>
            <span className="text-text">{formatDate(campaign.startDate)}</span>
          </div>
        ) : null}
        {campaign.endDate ? (
          <div className="flex justify-between">
            <span className="text-text-muted">Ends</span>
            <span className="text-text">{formatDate(campaign.endDate)}</span>
          </div>
        ) : null}
        {campaign.status === 'live' && daysLeft !== null ? (
          <p className="text-xs text-text-muted">
            {daysLeft > 1 ? `${daysLeft} days left` : daysLeft === 1 ? 'Ends tomorrow' : 'Ends today'}
          </p>
        ) : null}
      </Card>
    </Section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Whole days from now until the date; never negative. */
function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}
