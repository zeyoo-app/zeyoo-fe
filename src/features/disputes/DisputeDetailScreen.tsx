'use client';

import { useState } from 'react';

import { AsyncContent, Button, Textarea } from '@/design-system';
import { DisputeThread } from '@/shared/disputes/DisputeThread';
import { useDispute, useSendDisputeMessage } from '@/shared/disputes/hooks';
import { isDisputeActive } from '@/shared/disputes/presentation';
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
