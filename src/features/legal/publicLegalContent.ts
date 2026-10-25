/**
 * Public Privacy Policy and Terms of Service, served at /privacy and /terms-of-service
 * (the URLs registered with Google's OAuth consent screen). Held as data so legal can
 * revise a clause without touching layout.
 */

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface PublicLegalDocument {
  title: string;
  description: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

const CONTACT = 'support@zeyoo.app';

export const PRIVACY_POLICY: PublicLegalDocument = {
  title: 'Privacy Policy',
  description: 'How Zeyoo collects, uses and protects your information.',
  lastUpdated: 'Last updated: October 2026',
  intro:
    'Zeyoo connects brands running pay-per-view campaigns with creators who make content for them. This policy explains what we collect when you use the Zeyoo website and mobile app, why, and the choices you have.',
  sections: [
    {
      heading: '1. Information we collect',
      paragraphs: [
        'Account details: your name, email address, phone number, username, profile photo and role (brand or creator).',
        'Sign-in with Google: if you choose "Continue with Google", we receive your name, email address, profile photo and a Google account identifier. We never receive your Google password.',
        'Campaign and content details: campaigns you create, submissions you make, links to your posts and the view counts we verify for them.',
        'Payment details: brands fund campaigns and creators are paid out through our payment provider, Stripe. Card and bank details are collected and stored by Stripe, not by Zeyoo. We keep records of amounts, balances, payouts and refunds.',
        'Identity verification: creators may be asked to verify their identity before withdrawing earnings. Verification is handled by our payment provider.',
        'Technical data: device type, app version, IP address and security logs used to keep accounts safe and detect fraud.',
      ],
    },
    {
      heading: '2. How we use it',
      paragraphs: [
        'To create and secure your account, including sending sign-in codes by email or SMS.',
        'To run campaigns: matching creators with campaigns, verifying views, calculating and paying rewards.',
        'To prevent fraud and misuse, resolve disputes and meet legal and tax obligations.',
        'To send service messages such as sign-in codes, payment confirmations and notifications. We do not sell your personal data and we do not use it for third-party advertising.',
      ],
    },
    {
      heading: '3. Who we share it with',
      paragraphs: [
        'Brands and creators see the profile information needed to run a campaign together, such as your name, username, photo and submitted content.',
        'Service providers process data on our behalf: Stripe (payments and payouts), Google (sign-in), and our hosting, email and SMS providers. They may only use it to provide their service to us.',
        'We may disclose information when required by law or to protect the rights and safety of Zeyoo, our users or others.',
      ],
    },
    {
      heading: '4. Google user data',
      paragraphs: [
        'Zeyoo only uses Google sign-in to identify you: your basic profile (name and photo) and email address. We use this data to create and sign you in to your account and for no other purpose. We do not transfer it to third parties except as described above, and we do not use it for advertising.',
      ],
    },
    {
      heading: '5. Retention',
      paragraphs: [
        'We keep your information while your account is active. Financial records are kept for as long as the law requires. When you delete your account we remove or anonymise your personal data, except where we must retain it for legal, tax or fraud-prevention reasons.',
      ],
    },
    {
      heading: '6. Your choices and rights',
      paragraphs: [
        'You can view and edit your profile in the app, and request deletion of your account and data at any time by contacting us. Depending on where you live you may also have the right to access, correct, export or object to the processing of your data.',
      ],
    },
    {
      heading: '7. Security',
      paragraphs: [
        'We use encryption in transit, access controls and audit logging to protect your information. No system is perfectly secure, so please keep your account and devices safe.',
      ],
    },
    {
      heading: '8. Children',
      paragraphs: [
        'Zeyoo is not intended for anyone under 18, and we do not knowingly collect information from children.',
      ],
    },
    {
      heading: '9. Changes',
      paragraphs: [
        'We may update this policy. When we make material changes we will update the date above and, where appropriate, notify you in the app.',
      ],
    },
    {
      heading: '10. Contact',
      paragraphs: [`Questions or requests about your data: ${CONTACT}.`],
    },
  ],
};

export const TERMS_OF_SERVICE: PublicLegalDocument = {
  title: 'Terms of Service',
  description: 'The rules for using Zeyoo as a brand or a creator.',
  lastUpdated: 'Last updated: October 2026',
  intro:
    'These terms govern your use of Zeyoo. By creating an account or using the service you agree to them and to our Privacy Policy.',
  sections: [
    {
      heading: '1. Using Zeyoo',
      paragraphs: [
        'Zeyoo connects brands running content-reward campaigns with creators who produce content for them. You must be at least 18, provide accurate information and keep your sign-in secure. You are responsible for activity under your account and for the content you post or approve.',
      ],
    },
    {
      heading: '2. Brands: funding and campaigns',
      paragraphs: [
        'Brands fund campaigns in advance. Funds are held for the campaign and released to creators as verified views are earned, at the rate and per-creator cap shown on the campaign. Unspent, unearned funds may be refunded when a campaign ends, subject to our refund rules and any payment-processing fees.',
      ],
    },
    {
      heading: '3. Creators: earnings and payouts',
      paragraphs: [
        'Creators earn based on the reward terms shown on a campaign at the time of submission, counted on verified views only. To withdraw you must connect a payout account and complete identity verification with our payment provider. Payouts may be delayed or held while we review suspected fraud or a dispute.',
      ],
    },
    {
      heading: '4. Payments',
      paragraphs: [
        'Payments are processed by Stripe and are subject to Stripe’s terms. Zeyoo is not a bank. You are responsible for any taxes on your earnings.',
      ],
    },
    {
      heading: '5. Content and licence',
      paragraphs: [
        'Creators keep ownership of their content and grant the brand a licence to use approved submissions for marketing as described on the campaign. You must own or have the right to use everything you submit, and it must not infringe anyone’s rights or break the law.',
      ],
    },
    {
      heading: '6. Prohibited conduct',
      paragraphs: [
        'You must not submit fake or manipulated views, use bots or purchased engagement, misuse campaign funds, impersonate others, attempt to access other accounts or interfere with the service.',
      ],
    },
    {
      heading: '7. Disputes',
      paragraphs: [
        'If a submission, view count or payout is contested, either side may raise a dispute in the app. We will review the evidence and make a decision, which we will explain.',
      ],
    },
    {
      heading: '8. Suspension and termination',
      paragraphs: [
        'We may suspend or close accounts that break these terms, including fraudulent submissions or misuse of funds. You may close your account at any time; earned balances you are entitled to remain payable, subject to verification.',
      ],
    },
    {
      heading: '9. Disclaimers and liability',
      paragraphs: [
        'The service is provided "as is". To the extent the law allows, Zeyoo is not liable for indirect or consequential losses, and our total liability is limited to the fees you paid us in the 12 months before the claim.',
      ],
    },
    {
      heading: '10. Changes',
      paragraphs: [
        'We may update these terms. Continued use after an update means you accept the new terms.',
      ],
    },
    {
      heading: '11. Contact',
      paragraphs: [`Questions about these terms: ${CONTACT}.`],
    },
  ],
};

export const CAMPAIGN_RULES: PublicLegalDocument = {
  title: 'Campaign Rules',
  description: 'What every creator accepts when applying to a Zeyoo campaign, and what brands agree to.',
  lastUpdated: 'Last updated: October 2026',
  intro:
    'These rules apply to every Zeyoo campaign. Applying to a campaign means you accept them, together with that campaign’s own brief, requirements and reward terms.',
  sections: [
    {
      heading: '1. Applying and taking part',
      paragraphs: [
        'Apply only to campaigns you intend to complete, from an account you own.',
        'A brand may approve or decline any application. You can submit content only once approved.',
        'Private campaigns are open only to creators the brand invited.',
      ],
    },
    {
      heading: '2. Your content',
      paragraphs: [
        'Follow the campaign brief, required hashtags and mentions, and any content guidelines.',
        'Post original content you have the rights to. No copied, stolen or AI-faked footage of real people.',
        'Label paid content as an advertisement or paid partnership where the campaign or the law requires it.',
        'Keep the post live for the whole campaign; removing it early can cancel earnings for it.',
      ],
    },
    {
      heading: '3. Reviews and changes',
      paragraphs: [
        'The brand reviews every submission and may approve it, reject it with a reason, or ask for changes.',
        'When changes are requested, submit a revised post from the campaign page.',
        'If you think a decision is unfair, appeal it from My Submissions. Support responds within 2 business days.',
      ],
    },
    {
      heading: '4. Earnings',
      paragraphs: [
        'You earn on the reward terms shown on the campaign when you submitted, up to the per-creator cap and while the budget lasts.',
        'Only genuine views count. Bots, purchased views, engagement pods and repeat-view schemes are not paid.',
        'Earnings can be held while suspicious activity is reviewed. You will be told why and can dispute the review.',
      ],
    },
    {
      heading: '5. Withdrawals',
      paragraphs: [
        'Connect a payout account and verify your identity with our payment provider before withdrawing.',
        'Withdrawals are reviewed and may be held for checks before they are paid.',
      ],
    },
    {
      heading: '6. Brands',
      paragraphs: [
        'Fund a campaign before it goes live, and describe the brief and reward terms accurately.',
        'Review applications and submissions promptly and give a reason when you reject.',
        'Use approved content only as described in the campaign.',
      ],
    },
    {
      heading: '7. Breaking the rules',
      paragraphs: [
        'We may remove content, cancel earnings, hold payouts or suspend accounts that break these rules.',
        'Every decision can be disputed from the Disputes page.',
        `Questions about these rules: ${CONTACT}.`,
      ],
    },
  ],
};
