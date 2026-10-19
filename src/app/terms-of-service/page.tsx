import type { Metadata } from 'next';

import { PublicLegalPage } from '@/features/legal/PublicLegalPage';
import { TERMS_OF_SERVICE } from '@/features/legal/publicLegalContent';

export const metadata: Metadata = {
  title: 'Terms of Service — Zeyoo',
  description: TERMS_OF_SERVICE.description,
};

export default function TermsPage() {
  return <PublicLegalPage document={TERMS_OF_SERVICE} />;
}
