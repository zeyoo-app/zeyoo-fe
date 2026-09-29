/**
 * Help & Support copy (contract §1.6 — supplied by the client).
 *
 * Structured like `legalContent.ts` and for the same reason: the FAQ is reviewed as
 * prose by support, and the questions change as the product does. One document per
 * role, because a brand's questions are about funding campaigns and a creator's are
 * about getting paid — the shared screen picks between them by role.
 */

import type { Role } from '@/shared/api';

export interface HelpEntry {
  q: string;
  a: string;
}

export interface HelpDocument {
  title: string;
  intro: string;
  faq: HelpEntry[];
  contact: {
    title: string;
    body: string;
    email: string;
  };
}

const SUPPORT_CONTACT = {
  title: 'Still need help?',
  body: "Email support@zeyoo.com and we'll get back to you within 24 hours.",
  email: 'support@zeyoo.com',
};

export const BRAND_HELP_DOCUMENT: HelpDocument = {
  title: 'Help & Support',
  intro: 'Answers to common questions, and how to reach us.',
  faq: [
    {
      q: 'When are campaign funds charged?',
      a: 'Your Wallet balance is charged once you fund and launch a campaign. You can add funds anytime from the Wallet tab.',
    },
    {
      q: 'How do I review and pay creators?',
      a: "Open a campaign's Submissions screen to approve or reject each entry. Approved submissions are paid automatically once the campaign completes.",
    },
    {
      q: "Can I edit a campaign after it's live?",
      a: 'Reward, budget, and content requirements are locked once a campaign is live to keep things fair for creators who already joined.',
    },
    {
      q: 'How do I update my payment method?',
      a: 'Go to Profile > Payment Method to add or change your card.',
    },
  ],
  contact: SUPPORT_CONTACT,
};

export const CREATOR_HELP_DOCUMENT: HelpDocument = {
  title: 'Help & Support',
  intro: 'Answers to common questions, and how to reach us.',
  faq: [
    {
      q: 'How do I submit to a campaign?',
      a: 'Open a campaign from Discover, review the requirements, then paste your post link or upload your video in the submission section.',
    },
    {
      q: 'When will I get paid?',
      a: 'Approved submissions are paid after your verified views are processed. You can track pending and completed earnings in Wallet.',
    },
    {
      q: 'How do I connect my social accounts?',
      a: 'Go to Profile > Connected Accounts and connect the platforms where you publish content.',
    },
    {
      q: 'How do I add a payout method?',
      a: 'Go to Profile > Payout Method to add or update where your earnings are sent.',
    },
  ],
  contact: SUPPORT_CONTACT,
};

/** Brands get campaign funding answers, creators get payout answers. */
export function helpDocumentForRole(role: Role | undefined): HelpDocument {
  return role === 'creator' ? CREATOR_HELP_DOCUMENT : BRAND_HELP_DOCUMENT;
}
