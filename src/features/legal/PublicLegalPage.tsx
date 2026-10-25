import Link from 'next/link';

import { Logo } from '@/design-system';

import type { PublicLegalDocument } from './publicLegalContent';

/** Standalone, signed-out legal page: shared by /privacy and /terms-of-service. */
export function PublicLegalPage({ document }: { document: PublicLegalDocument }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Zeyoo home">
          <Logo height={26} />
        </Link>
        <nav className="flex gap-4 text-sm text-text-muted">
          <Link href="/privacy" className="hover:text-text">
            Privacy
          </Link>
          <Link href="/terms-of-service" className="hover:text-text">
            Terms
          </Link>
          <Link href="/campaign-rules" className="hover:text-text">
            Campaign Rules
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 pb-16 pt-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-semibold">{document.title}</h1>
          <p className="text-xs text-text-tertiary">{document.lastUpdated}</p>
        </div>
        <p className="text-[15px] leading-relaxed">{document.intro}</p>
        {document.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="font-display text-lg font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
