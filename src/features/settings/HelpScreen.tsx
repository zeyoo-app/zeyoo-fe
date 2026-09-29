'use client';

import { Button, Card, Divider, SectionHeader } from '@/design-system';
import { useAuthStore } from '@/shared/auth';
import { DetailShell } from '@/shared/shell';

import { helpDocumentForRole } from './helpContent';

/** Help & support: the FAQ for the reader's role, plus a contact action. */
export function HelpScreen() {
  const role = useAuthStore((state) => state.session?.role);
  const help = helpDocumentForRole(role);

  return (
    <DetailShell title={help.title} subtitle={help.intro}>
      <Card className="flex flex-col px-5 py-0">
        {help.faq.map((item, index) => (
          <div key={item.q}>
            <div className="flex flex-col gap-1 py-3.5">
              <h2 className="font-display text-[15px] font-semibold text-text">{item.q}</h2>
              <p className="text-sm text-text-muted">{item.a}</p>
            </div>
            {index < help.faq.length - 1 ? <Divider /> : null}
          </div>
        ))}
      </Card>

      <div>
        <SectionHeader title={help.contact.title} />
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-muted">{help.contact.body}</p>
          <Button variant="secondary" href={`mailto:${help.contact.email}`}>
            {help.contact.email}
          </Button>
        </div>
      </div>
    </DetailShell>
  );
}
