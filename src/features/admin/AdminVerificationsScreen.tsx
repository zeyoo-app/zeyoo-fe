'use client';

import { useState } from 'react';
import Link from 'next/link';

import { AsyncContent, Badge, Button, Card, EmptyState, Modal, Textarea, useConfirm } from '@/design-system';
import type { AdminVerification } from '@/shared/api';

import { AdminPageHeader, Pager } from './DataTable';
import { formatDateTime } from './format';
import { useAdminVerifications, useReviewVerification } from './hooks';

export function AdminVerificationsScreen() {
  const [page, setPage] = useState(1);
  const query = useAdminVerifications(page);
  const review = useReviewVerification();
  const confirm = useConfirm();
  const [rejecting, setRejecting] = useState<AdminVerification | null>(null);
  const [note, setNote] = useState('');

  const approve = async (item: AdminVerification) => {
    const confirmed = await confirm({
      title: 'Verify this creator?',
      message: `${item.displayName} gets a verified badge that brands can see.`,
      confirmLabel: 'Verify',
    });
    if (confirmed) review.mutate({ userId: item.userId, approve: true });
  };

  return (
    <>
      <AdminPageHeader
        title="Verifications"
        subtitle="Creators asking for a verified badge. Check that their connected accounts look genuine before approving; a rejection note is shown to the creator."
      />
      {review.error ? (
        <p className="mb-3 text-sm text-danger">
          {review.error instanceof Error ? review.error.message : 'Could not save the decision.'}
        </p>
      ) : null}
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(result) =>
          result.items.length === 0 ? (
            <EmptyState title="Nothing waiting" description="New verification requests appear here." />
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {result.items.map((item) => (
                  <Card key={item.userId} className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/users/${item.userId}`}
                          className="font-medium text-text underline-offset-2 hover:underline"
                        >
                          {item.displayName}
                        </Link>
                        <p className="text-xs text-text-muted">
                          @{item.username} · {item.email ?? 'no email'}
                          {item.country ? ` · ${item.country}` : ''}
                        </p>
                      </div>
                      <p className="text-xs text-text-muted">Requested {formatDateTime(item.requestedAt)}</p>
                    </div>
                    {item.headline ? <p className="text-sm text-text-muted">{item.headline}</p> : null}
                    {item.bio ? <p className="line-clamp-3 text-sm text-text">{item.bio}</p> : null}
                    <div className="flex flex-wrap gap-2">
                      {item.accounts.length === 0 ? (
                        <Badge tone="warning">No connected accounts</Badge>
                      ) : (
                        item.accounts.map((account) => (
                          <Badge
                            key={`${account.platform}-${account.handle}`}
                            tone={account.verified ? 'success' : 'neutral'}
                          >
                            {account.platform.toLowerCase()} @{account.handle}
                            {account.verified ? ' · proven' : ' · unproven'}
                          </Badge>
                        ))
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        fullWidth={false}
                        loading={review.isPending}
                        onClick={() => approve(item)}
                      >
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        fullWidth={false}
                        onClick={() => {
                          setNote('');
                          setRejecting(item);
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <Pager page={result.page} pageSize={result.pageSize} total={result.total} onPage={setPage} />
            </>
          )
        }
      </AsyncContent>

      <Modal open={Boolean(rejecting)} onClose={() => setRejecting(null)} title="Reject verification">
        <p className="text-sm text-text-muted">
          Tell {rejecting?.displayName} what to fix. They can request again afterwards.
        </p>
        <Textarea placeholder="Reason" value={note} onChange={(event) => setNote(event.target.value)} />
        <Button
          variant="danger"
          disabled={note.trim().length < 5}
          loading={review.isPending}
          onClick={() => {
            if (!rejecting) return;
            review.mutate(
              { userId: rejecting.userId, approve: false, note: note.trim() },
              { onSuccess: () => setRejecting(null) },
            );
          }}
        >
          Reject request
        </Button>
      </Modal>
    </>
  );
}
