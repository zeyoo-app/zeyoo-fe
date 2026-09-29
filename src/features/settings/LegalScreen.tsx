'use client';

import { DetailShell } from '@/shared/shell';

import { LEGAL_DOCUMENT } from './legalContent';

/** Terms & Privacy Policy, copy supplied by the client. */
export function LegalScreen() {
  return (
    <DetailShell title={LEGAL_DOCUMENT.title}>
      <p className="text-xs text-text-tertiary">{LEGAL_DOCUMENT.lastUpdated}</p>
      <p className="text-[15px] leading-relaxed text-text">{LEGAL_DOCUMENT.intro}</p>
      {LEGAL_DOCUMENT.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-1.5">
          <h2 className="font-display text-[15px] font-semibold text-text">{section.heading}</h2>
          <p className="text-sm leading-relaxed text-text-muted">{section.body}</p>
        </section>
      ))}
      <p className="text-sm text-text-muted">{LEGAL_DOCUMENT.closing}</p>
    </DetailShell>
  );
}
