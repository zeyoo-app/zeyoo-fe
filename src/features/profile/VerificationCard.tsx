'use client';

import { Badge, Button, Card, type BadgeTone } from '@/design-system';
import type { VerificationStatus } from '@/shared/api';

import { useCreatorProfile, useStartVerification } from './hooks';

const PRESENTATION: Record<VerificationStatus, { label: string; tone: BadgeTone; body: string }> = {
  unverified: {
    label: 'Not verified',
    tone: 'neutral',
    body: 'Verified creators get a badge brands can see. Connect your social accounts, then request verification.',
  },
  pending: {
    label: 'Under review',
    tone: 'warning',
    body: 'Our team is reviewing your request. We will notify you when there is a decision.',
  },
  verified: { label: 'Verified', tone: 'success', body: 'Brands can see your verified badge.' },
  rejected: {
    label: 'Not approved',
    tone: 'danger',
    body: 'Your request was not approved. Fix what is mentioned below and request again.',
  },
};

export function VerificationCard() {
  const profile = useCreatorProfile();
  const start = useStartVerification();
  const status = profile.data?.verification;
  if (!status) return null;
  const view = PRESENTATION[status];
  const canRequest = status === 'unverified' || status === 'rejected';

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-text">Verification</p>
        <Badge tone={view.tone}>{view.label}</Badge>
      </div>
      <p className="text-sm text-text-muted">{view.body}</p>
      {status === 'rejected' && profile.data?.verificationNote ? (
        <p className="text-sm text-text">{profile.data.verificationNote}</p>
      ) : null}
      {start.error ? (
        <p className="text-xs text-danger">
          {start.error instanceof Error ? start.error.message : 'Could not send your request.'}
        </p>
      ) : null}
      {canRequest ? (
        <Button size="sm" fullWidth={false} loading={start.isPending} onClick={() => start.mutate()}>
          {status === 'rejected' ? 'Request again' : 'Request verification'}
        </Button>
      ) : null}
    </Card>
  );
}
