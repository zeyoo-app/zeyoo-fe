import type { Metadata } from 'next';

import { PublicLegalPage } from '@/features/legal/PublicLegalPage';
import { CAMPAIGN_RULES } from '@/features/legal/publicLegalContent';

export const metadata: Metadata = {
  title: 'Campaign Rules — Zeyoo',
  description: CAMPAIGN_RULES.description,
};

export default function CampaignRulesPage() {
  return <PublicLegalPage document={CAMPAIGN_RULES} />;
}
