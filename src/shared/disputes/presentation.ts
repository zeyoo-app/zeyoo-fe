import type { BadgeTone } from '@/design-system';
import type { Dispute, DisputeEvent, DisputeStatus, DisputeSubjectType } from '@/shared/api';

interface StatusPresentation {
  label: string;
  tone: BadgeTone;
  /** What this status means for the person who opened the dispute. */
  explanation: string;
}

const STATUS: Record<DisputeStatus, StatusPresentation> = {
  open: {
    label: 'Waiting',
    tone: 'warning',
    explanation: 'Support has not picked this up yet. We aim to respond within 2 business days.',
  },
  in_review: {
    label: 'In review',
    tone: 'neutral',
    explanation: 'Support is looking at the case. You can add more details below.',
  },
  upheld: {
    label: 'Upheld',
    tone: 'success',
    explanation: 'Support decided in favour of the person who opened it. See their note below.',
  },
  denied: {
    label: 'Not upheld',
    tone: 'danger',
    explanation: 'Support did not uphold this dispute. See their note below for why.',
  },
};

const SUBJECT_LABEL: Record<DisputeSubjectType, string> = {
  submission: 'Submission',
  campaign: 'Campaign',
  withdrawal: 'Withdrawal',
  fraud_case: 'Earnings review',
  other: 'General',
};

export const AUTHOR_LABEL: Record<DisputeEvent['author'], string> = {
  you: 'You',
  support: 'Zeyoo support',
  other: 'Other party',
};

export function disputeStatusPresentation(status: DisputeStatus): StatusPresentation {
  return STATUS[status];
}

export function disputeSubjectLabel(subjectType: DisputeSubjectType): string {
  return SUBJECT_LABEL[subjectType];
}

export function isDisputeActive(dispute: Dispute): boolean {
  return dispute.status === 'open' || dispute.status === 'in_review';
}
