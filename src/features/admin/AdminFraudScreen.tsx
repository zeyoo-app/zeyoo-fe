'use client';

import { useState } from 'react';

import { AsyncContent, Badge, Button, Card, EmptyState, SegmentedToggle } from '@/design-system';
import type { FraudCase } from '@/shared/api';
import { useAdminCloseFraudCase, useAdminFraudCases } from '@/shared/disputes/hooks';

type Filter = 'open' | 'all';

const FILTERS = [
  { value: 'open' as const, label: 'Open' },
  { value: 'all' as const, label: 'All' },
];

const LEVEL_TONE = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
} as const;
const STATUS_LABEL: Record<FraudCase['status'], string> = {
  open: 'Earnings paused',
  confirmed: 'Problem confirmed',
  cleared: 'Cleared',
};

export function AdminFraudScreen() {
  const [filter, setFilter] = useState<Filter>('open');
  const query = useAdminFraudCases(filter === 'open' ? 'open' : undefined);
  const close = useAdminCloseFraudCase();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text">Earnings reviews</h1>
        <p className="text-sm text-text-muted">
          Creators brands have flagged. While a review is open, the creator earns nothing new on that
          campaign. Clear it to resume earnings, or confirm to keep them stopped.
        </p>
      </div>
      <SegmentedToggle
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        ariaLabel="Which reviews to show"
      />
      <AsyncContent isLoading={query.isLoading} isError={query.isError} data={query.data}>
        {(cases) =>
          cases.length === 0 ? (
            <EmptyState title="No reviews" description="Brand flags appear here." />
          ) : (
            <div className="flex flex-col gap-3">
              {cases.map((item) => (
                <Card key={item.id} className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-text">{item.creatorName}</p>
                      <p className="truncate text-xs text-text-muted">{item.campaignTitle}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone={LEVEL_TONE[item.level]}>{item.level} concern</Badge>
                      <Badge tone={item.status === 'open' ? 'warning' : 'neutral'}>
                        {STATUS_LABEL[item.status]}
                      </Badge>
                    </div>
                  </div>
                  {item.note ? <p className="text-sm text-text-muted">Brand’s note: {item.note}</p> : null}
                  <p className="text-xs text-text-tertiary">
                    Flagged {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  {item.status === 'open' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth={false}
                        loading={close.isPending}
                        onClick={() => close.mutate({ caseId: item.id, action: 'clear' })}
                      >
                        Clear and resume earnings
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        fullWidth={false}
                        loading={close.isPending}
                        onClick={() => close.mutate({ caseId: item.id, action: 'confirm' })}
                      >
                        Confirm problem
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )
        }
      </AsyncContent>
    </div>
  );
}
