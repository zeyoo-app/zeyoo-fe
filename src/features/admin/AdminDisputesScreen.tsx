'use client';

import { useState } from 'react';

import {
  AsyncContent,
  Badge,
  Button,
  Card,
  EmptyState,
  SegmentedToggle,
  Textarea,
  cn,
} from '@/design-system';
import type { Dispute } from '@/shared/api';
import { DisputeThread } from '@/shared/disputes/DisputeThread';
import {
  useAdminDisputes,
  useDecideDispute,
  useReviewDispute,
  useSendDisputeMessage,
} from '@/shared/disputes/hooks';
import {
  disputeStatusPresentation,
  disputeSubjectLabel,
  isDisputeActive,
} from '@/shared/disputes/presentation';

type Scope = 'active' | 'closed';

const SCOPES = [
  { value: 'active' as const, label: 'Needs a decision' },
  { value: 'closed' as const, label: 'Closed' },
];

export function AdminDisputesScreen() {
  const [scope, setScope] = useState<Scope>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useAdminDisputes(scope);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text">Disputes</h1>
        <p className="text-sm text-text-muted">
          Cases opened by creators and brands. Reply in the thread, then uphold or deny.
        </p>
      </div>
      <SegmentedToggle
        options={SCOPES}
        value={scope}
        onChange={(next) => {
          setScope(next);
          setSelectedId(null);
        }}
        ariaLabel="Which disputes to show"
      />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(disputes) =>
          disputes.length === 0 ? (
            <EmptyState
              title={scope === 'active' ? 'Nothing waiting' : 'No closed disputes'}
              description={scope === 'active' ? 'New disputes appear here as they are opened.' : ''}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-[320px_1fr]">
              <div className="flex flex-col gap-2">
                {disputes.map((dispute) => (
                  <DisputeListItem
                    key={dispute.id}
                    dispute={dispute}
                    selected={dispute.id === selectedId}
                    onSelect={() => setSelectedId(dispute.id)}
                  />
                ))}
              </div>
              <div>
                {disputes.find((dispute) => dispute.id === selectedId) ? (
                  <DisputePanel
                    key={selectedId}
                    dispute={disputes.find((dispute) => dispute.id === selectedId) as Dispute}
                  />
                ) : (
                  <Card className="p-6 text-sm text-text-muted">Choose a dispute to read it.</Card>
                )}
              </div>
            </div>
          )
        }
      </AsyncContent>
    </div>
  );
}

function DisputeListItem({
  dispute,
  selected,
  onSelect,
}: {
  dispute: Dispute;
  selected: boolean;
  onSelect: () => void;
}) {
  const status = disputeStatusPresentation(dispute.status);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-2xl border p-4 text-start transition-colors',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:bg-surface-hover',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          {disputeSubjectLabel(dispute.subjectType)}
        </p>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className="mt-1 truncate font-medium text-text">{dispute.title}</p>
      <p className="truncate text-xs text-text-muted">By {dispute.openedByName}</p>
    </button>
  );
}

/** What upholding or denying will change, so the decision is never a surprise. */
function consequences(dispute: Dispute): { upheld: string; denied: string } {
  if (dispute.subjectType === 'submission') {
    return {
      upheld: 'The submission is approved and the creator starts earning from its views.',
      denied: 'The rejection stands. Nothing else changes.',
    };
  }
  if (dispute.subjectType === 'fraud_case') {
    return {
      upheld: 'The earnings review is cleared and the creator’s earnings resume.',
      denied: 'The review is confirmed and the creator earns nothing more on that campaign.',
    };
  }
  return {
    upheld: 'The dispute is closed in favour of the person who opened it. No automatic change.',
    denied: 'The dispute is closed without action. No automatic change.',
  };
}

function DisputePanel({ dispute }: { dispute: Dispute }) {
  const review = useReviewDispute();
  const decide = useDecideDispute();
  const send = useSendDisputeMessage(dispute.id);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const effects = consequences(dispute);
  const active = isDisputeActive(dispute);

  return (
    <div className="flex flex-col gap-4">
      <DisputeThread dispute={dispute} viewer="admin" />

      {active ? (
        <>
          <Card className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium text-text">Reply in the thread</p>
            <Textarea
              placeholder="Ask a question or share an update"
              value={reply}
              onChange={(event) => setReply(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                fullWidth={false}
                disabled={reply.trim().length === 0}
                loading={send.isPending}
                onClick={() => send.mutate(reply.trim(), { onSuccess: () => setReply('') })}
              >
                Send reply
              </Button>
              {dispute.status === 'open' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  loading={review.isPending}
                  onClick={() => review.mutate(dispute.id)}
                >
                  Take into review
                </Button>
              ) : null}
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium text-text">Decide</p>
            <Textarea
              placeholder="Your decision note (sent to the person who opened it)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <ul className="text-xs text-text-muted">
              <li>
                <strong className="text-text">Uphold:</strong> {effects.upheld}
              </li>
              <li>
                <strong className="text-text">Deny:</strong> {effects.denied}
              </li>
            </ul>
            {decide.error ? (
              <p className="text-xs text-danger">
                {decide.error instanceof Error ? decide.error.message : 'Could not save the decision.'}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                fullWidth={false}
                disabled={note.trim().length < 3}
                loading={decide.isPending}
                onClick={() =>
                  decide.mutate({
                    disputeId: dispute.id,
                    outcome: 'upheld',
                    note: note.trim(),
                  })
                }
              >
                Uphold
              </Button>
              <Button
                size="sm"
                variant="danger"
                fullWidth={false}
                disabled={note.trim().length < 3}
                loading={decide.isPending}
                onClick={() =>
                  decide.mutate({
                    disputeId: dispute.id,
                    outcome: 'denied',
                    note: note.trim(),
                  })
                }
              >
                Deny
              </Button>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
