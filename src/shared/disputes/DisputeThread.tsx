'use client';

import type { Dispute } from '@/shared/api';
import { Badge, Card, cn } from '@/design-system';

import { AUTHOR_LABEL, disputeStatusPresentation } from './presentation';

/** The status explanation and message history of a dispute, for users and admins alike. */
export function DisputeThread({ dispute, viewer }: { dispute: Dispute; viewer: 'user' | 'admin' }) {
  const status = disputeStatusPresentation(dispute.status);

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col items-start gap-2 p-4">
        <Badge tone={status.tone}>{status.label}</Badge>
        <p className="text-sm text-text-muted">
          {viewer === 'admin' ? `Opened by ${dispute.openedByName}.` : status.explanation}
        </p>
      </Card>
      {dispute.events.map((event) => (
        <div
          key={event.id}
          className={cn(
            'rounded-2xl p-4',
            event.author === 'support' ? 'bg-primary/10' : 'bg-surface-raised',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-text">
              {viewer === 'admin' && event.author === 'you'
                ? 'You (support)'
                : viewer === 'admin' && event.author === 'other'
                  ? dispute.openedByName
                  : AUTHOR_LABEL[event.author]}
            </p>
            <p className="text-xs text-text-tertiary">
              {new Date(event.date).toLocaleString()}
            </p>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-text">{event.message}</p>
        </div>
      ))}
    </div>
  );
}
