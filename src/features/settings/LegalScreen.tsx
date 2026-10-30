'use client';

import { useI18n } from '@/shared/i18n';
import { DetailShell } from '@/shared/shell';

import { legalDocument } from './legalContent';

/** Terms & Privacy Policy, copy supplied by the client. */
export function LegalScreen() {
  const { locale } = useI18n();
  const legal = legalDocument(locale);
  return (
    <DetailShell title={legal.title}>
      <p className="text-xs text-text-tertiary">{legal.lastUpdated}</p>
      <p className="text-[15px] leading-relaxed text-text">{legal.intro}</p>
      {legal.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-1.5">
          <h2 className="font-display text-[15px] font-semibold text-text">{section.heading}</h2>
          <p className="text-sm leading-relaxed text-text-muted">{section.body}</p>
        </section>
      ))}
      <p className="text-sm text-text-muted">{legal.closing}</p>
    </DetailShell>
  );
}
