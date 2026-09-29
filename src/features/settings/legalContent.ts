/**
 * Terms & Privacy Policy copy (contract §1.6 — supplied by the client's counsel).
 *
 * Held as structured data rather than UI strings: it is one long document that is
 * reviewed as prose, not assembled from layout keys, and it changes as a whole
 * whenever legal revises a clause.
 */

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  closing: string;
}

export const LEGAL_DOCUMENT: LegalDocument = {
  title: 'Terms & Privacy Policy',
  lastUpdated: 'Last updated: August 2026',
  intro:
    'Welcome to Zeyoo. By creating an account you agree to these Terms of Service and our Privacy Policy.',
  sections: [
    {
      heading: '1. Using Zeyoo',
      body: "Zeyoo connects businesses running content-reward campaigns with creators who produce content for those campaigns. You must provide accurate account information and are responsible for the content you post or approve.",
    },
    {
      heading: '2. Payments & Rewards',
      body: "Businesses fund campaigns in advance. Creators are paid based on the reward terms shown on each campaign at the time of submission. Payouts are processed to the payout method on file.",
    },
    {
      heading: '3. Content Ownership',
      body: "Creators retain ownership of their content, and grant the campaign's business a license to use approved submissions for marketing purposes as described on the campaign.",
    },
    {
      heading: '4. Privacy',
      body: 'We collect the information you provide (profile, campaign, and payment details) to operate Zeyoo. We do not sell your personal data. See our Privacy Policy for full details on what we collect and how it is used.',
    },
    {
      heading: '5. Account Termination',
      body: 'We may suspend accounts that violate these terms, including fraudulent submissions or misuse of campaign funds.',
    },
  ],
  closing:
    'Questions about these terms? Reach out from the Help & Support screen in your Profile.',
};
