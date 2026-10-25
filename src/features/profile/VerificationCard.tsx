'use client';

import { Badge, Button, Card, type BadgeTone } from '@/design-system';
import type { VerificationStatus } from '@/shared/api';

import { useConnectPayout, useWallet } from '../earnings/hooks';
import { useCreatorProfile, useStartVerification } from './hooks';

const PRESENTATION: Record<VerificationStatus, { label: string; tone: BadgeTone; body: string }> = {
  unverified: {
    label: 'Not verified',
    tone: 'neutral',
    body: 'Verified creators get a badge brands can see. Verify your identity and connect your social accounts, then request verification.',
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
  const wallet = useWallet();
  const status = profile.data?.verification;
  if (!status) return null;
  const view = PRESENTATION[status];
  const identity = identityStatusOf(wallet.data);
  // Identity comes first: the profile review checks a person the provider has already verified.
  const canRequest = (status === 'unverified' || status === 'rejected') && identity === 'verified';

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-text">Verification</p>
        <Badge tone={view.tone}>{view.label}</Badge>
      </div>
      <p className="text-sm text-text-muted">{view.body}</p>
      <IdentityStep identity={identity} />
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

type IdentityStatus = 'not_started' | 'in_progress' | 'verified';

function identityStatusOf(wallet: { payoutConnected: boolean; identityStatus?: IdentityStatus } | undefined): IdentityStatus {
  if (!wallet) return 'not_started';
  return wallet.identityStatus ?? (wallet.payoutConnected ? 'verified' : 'not_started');
}

const IDENTITY: Record<IdentityStatus, { label: string; tone: BadgeTone; body: string }> = {
  not_started: {
    label: 'Not started',
    tone: 'neutral',
    body: 'Our payment provider, Stripe, verifies your identity and sets up where your earnings are paid.',
  },
  in_progress: {
    label: 'In progress',
    tone: 'warning',
    body: 'Stripe is checking your details, or needs a little more from you. Continue to finish.',
  },
  verified: { label: 'Verified', tone: 'success', body: 'Stripe has verified your identity and you can withdraw your earnings.' },
};

/** Identity verification through the payment provider's hosted process (contract §1.3, §1.5). */
function IdentityStep({ identity }: { identity: IdentityStatus }) {
  const connect = useConnectPayout();
  const view = IDENTITY[identity];
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text">Identity</p>
        <Badge tone={view.tone}>{view.label}</Badge>
      </div>
      <p className="text-xs text-text-muted">{view.body}</p>
      {identity !== 'verified' ? (
        <div>
          <Button size="sm" variant="secondary" fullWidth={false} loading={connect.isPending} onClick={() => connect.mutate()}>
            {identity === 'in_progress' ? 'Continue with Stripe' : 'Verify identity'}
          </Button>
        </div>
      ) : null}
      {connect.error ? (
        <p className="text-xs text-danger">
          {connect.error instanceof Error ? connect.error.message : 'Could not start identity verification.'}
        </p>
      ) : null}
    </div>
  );
}
