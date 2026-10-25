'use client';

import { useState } from 'react';

import { AsyncContent, Button, Textarea } from '@/design-system';
import { DisputeThread } from '@/shared/disputes/DisputeThread';
import { useDispute, useEscalateDispute, useSendDisputeMessage } from '@/shared/disputes/hooks';
import { isDisputeActive } from '@/shared/disputes/presentation';
import type { Dispute } from '@/shared/api';
import { DetailShell } from '@/shared/shell';

export function DisputeDetailScreen({ disputeId }: { disputeId: string }) {
  const query = useDispute(disputeId);
  const send = useSendDisputeMessage(disputeId);
  const [draft, setDraft] = useState('');

  return (
    <DetailShell eyebrow="Dispute" title={query.data?.title ?? 'Dispute'}>
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(dispute) => (
          <>
            <DisputeThread dispute={dispute} viewer="user" />
            <ResponseTime dispute={dispute} />
            {isDisputeActive(dispute) ? (
              <div className="flex flex-col gap-3">
                <Textarea
                  placeholder="Add more details or reply to support"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                {send.error ? (
                  <p className="text-xs text-danger">
                    {send.error instanceof Error ? send.error.message : 'Could not send your message.'}
                  </p>
                ) : null}
                <Button
                  disabled={draft.trim().length === 0}
                  loading={send.isPending}
                  onClick={() => send.mutate(draft.trim(), { onSuccess: () => setDraft('') })}
                >
                  Send message
                </Button>
              </div>
            ) : (
              <p className="text-center text-sm text-text-muted">
                This dispute is closed. Open a new one if something else comes up.
              </p>
            )}
          </>
        )}
      </AsyncContent>
    </DetailShell>
  );
}

/**
 * Support's response-time commitment (contract §1.10): when a reply is due and, once it is
 * overdue, the escalation path. Overdue disputes are also escalated automatically.
 */
function ResponseTime({ dispute }: { dispute: Dispute }) {
  const escalate = useEscalateDispute(dispute.id);
  if (!isDisputeActive(dispute)) return null;
  const due = new Date(dispute.responseDueAt).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
  if (dispute.escalatedAt) {
    return <p className="text-sm text-warning">Escalated to senior support. It is now first in their queue.</p>;
  }
  if (!dispute.overdue) {
    return <p className="text-sm text-text-muted">Support will reply by {due}.</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-warning">Support has not replied by {due}.</p>
      {dispute.canEscalate ? (
        <Button size="sm" variant="secondary" fullWidth={false} loading={escalate.isPending} onClick={() => escalate.mutate()}>
          Escalate
        </Button>
      ) : null}
      {escalate.error ? (
        <p className="text-xs text-danger">{escalate.error instanceof Error ? escalate.error.message : 'Could not escalate.'}</p>
      ) : null}
    </div>
  );
}
