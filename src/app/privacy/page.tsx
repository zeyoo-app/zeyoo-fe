import type { Metadata } from 'next';

import { PublicLegalPage } from '@/features/legal/PublicLegalPage';
import { PRIVACY_POLICY } from '@/features/legal/publicLegalContent';

export const metadata: Metadata = {
  title: 'Privacy Policy — Zeyoo',
  description: PRIVACY_POLICY.description,
};

export default function PrivacyPage() {
  return <PublicLegalPage document={PRIVACY_POLICY} />;
}
