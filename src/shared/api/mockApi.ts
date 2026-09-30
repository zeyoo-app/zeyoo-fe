import type { Money } from '../money/money';
import { cardDigits, cardLast4, luhnValid } from '../format/card';
import type { ZeyooApi } from './ZeyooApi';
import type {
  AddPaymentMethodInput,
  AiBriefRequest,
  AiBriefResult,
  AiIdeasResult,
  AppNotification,
  BillingPlan,
  BrandBilling,
  BrandDashboard,
  BrandLedgerEntry,
  BrandProfile,
  Campaign,
  CampaignCategory,
  CreateCampaignInput,
  CreatorDirectoryEntry,
  CreatorProfile,
  CreatorSubmission,
  Dispute,
  LedgerEntry,
  NotificationPreferences,
  OpenDisputeInput,
  ReviewSubmissionInput,
  Role,
  Session,
  Submission,
  SubmitParticipationInput,
  UpdateBrandProfileInput,
  UpdateProfileInput,
  WalletSummary,
  WithdrawInput,
} from './types';

/**
 * In-memory stand-in for the backend, seeded with realistic data. It computes
 * earnings (views × rate, capped) here because it plays the role of the server; the
 * client-side code never does this math (design.md §6).
 */

const USD = 'USD';
const VIEWS_PER_RATE_UNIT = 1000;
const NETWORK_DELAY_MS = 320;

function usd(minorUnits: number): Money {
  return { minorUnits, currency: USD };
}

function earningFor(views: number, rate: Money, cap: Money): Money {
  const raw = Math.round((views / VIEWS_PER_RATE_UNIT) * rate.minorUnits);
  return usd(Math.min(raw, cap.minorUnits));
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// -------------------------------------------------------------------------------------
// Seed state
// -------------------------------------------------------------------------------------

const CAP = usd(5000); // $50 per-creator cap

// The campaign taxonomy. A brand's industry is picked from the same list so a
// brand and the campaigns it runs stay in one vocabulary.
const campaignCategories: CampaignCategory[] = [
  { id: 'category-beauty', name: 'Beauty', slug: 'beauty' },
  { id: 'category-fashion', name: 'Fashion', slug: 'fashion' },
  { id: 'category-food', name: 'Food & Drink', slug: 'food-drink' },
  { id: 'category-technology', name: 'Technology', slug: 'technology' },
];

const campaigns: Campaign[] = [
  {
    id: 'summer-skincare',
    title: 'Summer Skincare Launch',
    brandName: 'Glow Beauty Co.',
    platform: 'instagram',
    ratePerThousandViews: usd(300),
    budget: usd(62500),
    budgetSpent: usd(24720),
    perCreatorCap: CAP,
    status: 'live',
    submissionCount: 18,
    brief:
      'Creators are posting short Reels showing their daily skincare routine featuring the Nimbus glow serum. Review submissions below and approve the ones that fit your brief.',
    requirements: {
      hashtags: ['#GlowWithNimbus'],
      mentions: ['@glowbeauty'],
      contentRules: [
        'Show the product clearly in the first 3 seconds',
        'Include the campaign hashtag in your caption',
        'No competitor branding visible',
      ],
      disclosureRequired: true,
    },
    referenceMaterials: [
      { id: 'shots', name: 'Product Shots.zip', url: 'https://assets.zeyoo.app/glow/shots.zip' },
    ],
  },
  {
    id: 'app-launch-buzz',
    title: 'App Launch Buzz',
    brandName: 'Nimbus App',
    platform: 'tiktok',
    ratePerThousandViews: usd(400),
    budget: usd(80000),
    budgetSpent: usd(12400),
    perCreatorCap: CAP,
    status: 'live',
    submissionCount: 12,
    brief:
      'Post a short video showing how you use the Nimbus app in your daily routine. Tag @nimbusapp and use #NimbusLaunch. Any format works — reviews, tutorials, or a day-in-the-life.',
    requirements: {
      hashtags: ['#NimbusLaunch'],
      mentions: ['@nimbusapp'],
      contentRules: ['Show the Nimbus app in use within the first 3 seconds', 'No competing apps on screen'],
      disclosureRequired: true,
    },
    referenceMaterials: [
      { id: 'demo', name: 'Product Demo Video.mp4', url: 'https://assets.zeyoo.app/nimbus/demo.mp4' },
      { id: 'kit', name: 'Brand Asset Kit.zip', url: 'https://assets.zeyoo.app/nimbus/kit.zip' },
    ],
  },
];

const submissionsByCampaign: Record<string, Submission[]> = {
  'summer-skincare': [
    {
      id: 'sub-lina',
      campaignId: 'summer-skincare',
      creatorHandle: '@lina.glow',
      postUrl: 'instagram.com/p/lina456',
      kind: 'link',
      views: 2400,
      earning: earningFor(2400, usd(300), CAP),
      status: 'pending',
    },
    {
      id: 'sub-amira',
      campaignId: 'summer-skincare',
      creatorHandle: '@amira.skin',
      postUrl: 'instagram.com/p/amira221',
      kind: 'link',
      views: 5700,
      earning: earningFor(5700, usd(300), CAP),
      status: 'approved',
    },
    {
      id: 'sub-noor',
      campaignId: 'summer-skincare',
      creatorHandle: '@noor.beautyy',
      postUrl: 'instagram.com/p/noor089',
      kind: 'link',
      views: 0,
      earning: usd(0),
      status: 'rejected',
      rejectionReason: 'Off-brief — the serum is not shown in the video.',
    },
  ],
};

const mySubmissions: CreatorSubmission[] = [
  {
    id: 'my-summer',
    campaignId: 'summer-skincare',
    campaignTitle: 'Summer Skincare Launch',
    brandName: 'Glow Beauty Co.',
    creatorHandle: '@you',
    postUrl: 'instagram.com/p/you123',
    kind: 'link',
    views: 12400,
    earning: earningFor(12400, usd(300), CAP),
    cap: CAP,
    capReached: false,
    status: 'approved',
  },
  {
    id: 'my-nimbus',
    campaignId: 'app-launch-buzz',
    campaignTitle: 'App Launch Buzz',
    brandName: 'Nimbus App',
    creatorHandle: '@you',
    postUrl: 'tiktok.com/@you/video/456',
    kind: 'upload',
    views: 3100,
    earning: earningFor(3100, usd(400), CAP),
    cap: CAP,
    capReached: false,
    status: 'pending',
    onHold: true,
    holdReason: 'view authenticity check in progress',
  },
  {
    id: 'my-holiday',
    campaignId: 'app-launch-buzz',
    campaignTitle: 'Holiday Gift Guide',
    brandName: 'Northwind',
    creatorHandle: '@you',
    postUrl: 'instagram.com/p/you789',
    kind: 'link',
    views: 0,
    earning: usd(0),
    cap: CAP,
    capReached: false,
    status: 'rejected',
    rejectionReason: 'Missing the required #NorthwindGift hashtag.',
  },
];

let wallet: WalletSummary = {
  available: usd(4960),
  pending: usd(1240),
  held: usd(0),
  lifetimeEarned: usd(18720),
  payoutConnected: false,
};

const ledger: LedgerEntry[] = [
  { id: 'l1', kind: 'earning', description: 'Summer Skincare Launch', amount: usd(3720), date: daysAgo(2), status: 'completed' },
  { id: 'l2', kind: 'earning', description: 'App Launch Buzz', amount: usd(1240), date: daysAgo(4), status: 'pending' },
  { id: 'l3', kind: 'withdrawal', description: 'Withdrawal to bank', amount: usd(-5000), date: daysAgo(9), status: 'completed' },
  { id: 'l4', kind: 'earning', description: 'Spring Refresh', amount: usd(5000), date: daysAgo(14), status: 'completed' },
];

let creatorProfile: CreatorProfile = {
  handle: '@you',
  displayName: 'Alex Rivera',
  bio: 'Beauty & lifestyle creator. Turning everyday routines into content that converts.',
  categories: ['Beauty', 'Lifestyle'],
  verification: 'unverified',
  payoutConnected: false,
  socialAccounts: [
    { platform: 'instagram', handle: '@you', connected: true, followers: 48200 },
    { platform: 'tiktok', handle: '@you', connected: false, followers: 0 },
    { platform: 'youtube', handle: '', connected: false, followers: 0 },
    { platform: 'snapchat', handle: '', connected: false, followers: 0 },
  ],
};

const directory: CreatorDirectoryEntry[] = [
  { id: 'c-lina', handle: '@lina.glow', displayName: 'Lina Park', platforms: ['instagram'], categories: ['Beauty'], followers: 82000, averageViews: 14500 },
  { id: 'c-amira', handle: '@amira.skin', displayName: 'Amira Haddad', platforms: ['instagram', 'tiktok'], categories: ['Beauty', 'Wellness'], followers: 121000, averageViews: 26300 },
  { id: 'c-devon', handle: '@devon.makes', displayName: 'Devon Cole', platforms: ['tiktok', 'youtube'], categories: ['Tech'], followers: 54000, averageViews: 33100 },
  { id: 'c-mika', handle: '@mika.moves', displayName: 'Mika Tan', platforms: ['tiktok'], categories: ['Fitness'], followers: 210000, averageViews: 41200 },
];

let notifications: AppNotification[] = [
  { id: 'n1', type: 'submission', title: 'Submission approved', body: 'Your Summer Skincare Launch post was approved.', date: daysAgo(0), read: false },
  { id: 'n2', type: 'payout', title: 'Earnings updated', body: 'You earned $12.40 from App Launch Buzz.', date: daysAgo(1), read: false },
  { id: 'n3', type: 'campaign', title: 'New campaign invite', body: 'Nimbus App invited you to App Launch Buzz.', date: daysAgo(2), read: true },
  { id: 'n4', type: 'system', title: 'Verify your identity', body: 'Complete verification to unlock withdrawals.', date: daysAgo(3), read: true },
];

let brandBilling: BrandBilling = {
  plan: 'Growth',
  monthlySpend: usd(245000),
  totalFunded: usd(1420000),
  paymentMethodLast4: '4242',
};

const brandLedger: BrandLedgerEntry[] = [
  { id: 'b1', kind: 'topup', description: 'Wallet top-up', amount: usd(50000), date: '2026-08-24T09:12:00.000Z' },
  { id: 'b2', kind: 'campaign', description: 'Campaign: Summer Skincare', amount: usd(-12500), date: '2026-08-22T14:40:00.000Z' },
  { id: 'b3', kind: 'campaign', description: 'Campaign: App Launch', amount: usd(-8000), date: '2026-08-18T11:05:00.000Z' },
];

let brandProfileState: BrandProfile = {
  organizationName: 'Glow Beauty Co.',
  website: 'https://glowbeauty.co',
  industry: 'Beauty',
  plan: 'Growth',
  teamMembers: [
    { id: 't1', name: 'Maya Chen', email: 'maya@glowbeauty.co', role: 'Owner' },
    { id: 't2', name: 'Sam Okafor', email: 'sam@glowbeauty.co', role: 'Admin' },
    { id: 't3', name: 'Priya Nair', email: 'priya@glowbeauty.co', role: 'Member' },
  ],
};

let notificationPrefs: NotificationPreferences = {
  submissionUpdates: true,
  payoutUpdates: true,
  campaignInvites: true,
  productNews: false,
};

const disputes: Dispute[] = [
  {
    id: 'd1',
    submissionId: 'my-holiday',
    campaignTitle: 'Holiday Gift Guide',
    status: 'in_review',
    reason: 'My post did include the hashtag in the caption.',
    createdAt: daysAgo(1),
    events: [
      { id: 'de1', author: 'You', message: 'Opened a dispute over the rejection.', date: daysAgo(1) },
      { id: 'de2', author: 'Zeyoo Support', message: 'Thanks — we are reviewing the post with the brand.', date: daysAgo(0) },
    ],
  },
];

// -------------------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------------------

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

function requireCampaign(campaignId: string): Campaign {
  const campaign = campaigns.find((entry) => entry.id === campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }
  return campaign;
}

function brandProfile(): BrandProfile {
  return { ...brandProfileState, plan: brandBilling.plan };
}

function brandDashboard(): BrandDashboard {
  const live = campaigns.filter((campaign) => campaign.status === 'live');
  const pending = Object.values(submissionsByCampaign)
    .flat()
    .filter((submission) => submission.status === 'pending').length;
  return {
    greetingName: 'Glow Beauty Co.',
    stats: [
      { value: String(live.length), label: 'Active Campaigns', caption: '+1 this month' },
      { value: String(pending || 24), label: 'Pending Submissions', caption: '+12% this month' },
      { value: '285K', label: 'Total Verified Views', caption: '+18% this month' },
      { value: '$2,450', label: 'Creator Rewards Paid', caption: 'this month' },
    ],
    activeCampaigns: live,
  };
}

// -------------------------------------------------------------------------------------
// Factory
// -------------------------------------------------------------------------------------

// The dev backend logs a random 6-digit code; the mock accepts this fixed one so
// the confirm-email and reset flows are demoable end-to-end without a server. Both
// success and error states are reachable — any other code is rejected.
const MOCK_VERIFICATION_CODE = '000000';

function mockRoleFor(email: string): Role {
  return email.toLowerCase().includes('creator') ? 'creator' : 'brand';
}

function mockSession(
  role: Role,
  email: string,
  emailVerified: boolean,
  hasCreatorProfile = true,
): Session {
  return {
    userId: `mock-${role}`,
    role,
    displayName: role === 'brand' ? 'Glow Beauty Co.' : creatorProfile.displayName,
    email,
    emailVerified,
    hasOrganization: role !== 'brand',
    hasCreatorProfile: role !== 'creator' || hasCreatorProfile,
  };
}

export function createMockApi(): ZeyooApi {
  // The account most recently created via signUp, awaiting email confirmation.
  let pendingVerification: Session | null = null;
  // The last session this client established, so setup and other follow-up calls
  // hand back the same account (and email) the user signed in with.
  let active: Session | null = null;

  return {
    requestSignInCode: ({ email }) => {
      // Mock has no server to resolve the role from an address, so derive it for
      // dev convenience: "creator@…" → creator, anything else → brand.
      const role = mockRoleFor(email);
      pendingVerification = mockSession(role, email, false, role !== 'creator');
      return delay(undefined);
    },

    signInWithCode: ({ email, code }) => {
      if (code !== MOCK_VERIFICATION_CODE) {
        return Promise.reject(new Error('This code is invalid or has expired.'));
      }
      const role = pendingVerification?.role ?? mockRoleFor(email);
      active = { ...mockSession(role, email, true, role !== 'creator'), hasOrganization: true };
      pendingVerification = null;
      return delay(active);
    },

    signUp: ({ role, email }) => {
      pendingVerification = mockSession(role, email, false, role !== 'creator');
      return delay(pendingVerification);
    },

    oauthSignIn: ({ role }) => {
      // A provider-verified email means the account is active immediately.
      active = mockSession(role, `${role}@oauth.zeyoo.com`, true);
      return delay(active);
    },

    verifyEmail: ({ code }) => {
      if (code !== MOCK_VERIFICATION_CODE) {
        return Promise.reject(new Error('This code is invalid or has expired.'));
      }
      const session = {
        ...(pendingVerification ?? mockSession('creator', 'creator@zeyoo.com', false)),
        emailVerified: true,
      };
      pendingVerification = null;
      active = session;
      return delay(session);
    },

    resendVerificationCode: () => delay(undefined),

    requestPasswordReset: () => delay(undefined),

    resetPassword: ({ code }) =>
      code === MOCK_VERIFICATION_CODE
        ? delay(undefined)
        : Promise.reject(new Error('This code is invalid or has expired.')),

    setupBrand: ({ name }) =>
      delay({
        ...(active ?? mockSession('brand', 'brand@zeyoo.com', true)),
        displayName: name,
        hasOrganization: true,
      }),

    setupCreator: ({ displayName, username, avatarUrl, platforms }) => {
      const connected = (platform: string) =>
        platforms.includes(platform as 'instagram' | 'tiktok' | 'snapchat');
      creatorProfile = {
        ...creatorProfile,
        displayName,
        handle: `@${username}`,
        avatarUrl,
        socialAccounts: creatorProfile.socialAccounts.map((account) => ({
          ...account,
          connected: connected(account.platform),
          handle: connected(account.platform) ? `@${username}` : account.handle,
        })),
      };
      return delay({
        ...(active ?? mockSession('creator', 'creator@zeyoo.com', true, true)),
        displayName,
        hasCreatorProfile: true,
      });
    },

    getBrandDashboard: () => delay(brandDashboard()),

    getBrandCampaigns: () => delay([...campaigns]),

    getCampaign: (campaignId) => delay(requireCampaign(campaignId)),

    getCampaignCategories: () => delay([...campaignCategories]),

    createCampaign: (input: CreateCampaignInput) => {
      const campaign: Campaign = {
        id: `campaign-${Date.now()}`,
        brandName: 'Glow Beauty Co.',
        budgetSpent: usd(0),
        submissionCount: 0,
        status: 'draft',
        referenceMaterials: input.referenceMaterials ?? [],
        ...input,
      };
      campaigns.unshift(campaign);
      submissionsByCampaign[campaign.id] = [];
      return delay(campaign);
    },

    fundCampaign: ({ campaignId, amount }) => {
      requireCampaign(campaignId);
      return delay({
        fundingId: `funding-${Date.now()}`,
        status: 'succeeded' as const,
        amount,
      });
    },

    setCampaignStatus: ({ campaignId, status }) => {
      const campaign = requireCampaign(campaignId);
      campaign.status = status;
      return delay(campaign);
    },

    getDiscoverCampaigns: () => delay(campaigns.filter((campaign) => campaign.status === 'live')),

    getCampaignSubmissions: (campaignId) => delay(submissionsByCampaign[campaignId] ?? []),

    reviewSubmission: ({ submissionId, decision, reason }: ReviewSubmissionInput) => {
      const submission = Object.values(submissionsByCampaign)
        .flat()
        .find((entry) => entry.id === submissionId);
      if (!submission) {
        throw new Error(`Submission not found: ${submissionId}`);
      }
      submission.status = decision === 'approve' ? 'approved' : 'rejected';
      submission.rejectionReason = decision === 'reject' ? reason : undefined;
      return delay(submission);
    },

    getMySubmissions: () => delay([...mySubmissions]),

    submitParticipation: ({ campaignId, postUrl, kind }: SubmitParticipationInput) => {
      const campaign = requireCampaign(campaignId);
      const created: CreatorSubmission = {
        id: `my-${Date.now()}`,
        campaignId,
        campaignTitle: campaign.title,
        brandName: campaign.brandName,
        creatorHandle: creatorProfile.handle,
        postUrl,
        kind,
        views: 0,
        earning: usd(0),
        cap: campaign.perCreatorCap,
        capReached: false,
        status: 'pending',
      };
      mySubmissions.unshift(created);
      return delay(created);
    },

    getWallet: () => delay(wallet),

    getLedger: () => delay([...ledger]),

    connectPayout: () => {
      wallet = { ...wallet, payoutConnected: true };
      creatorProfile = { ...creatorProfile, payoutConnected: true };
      return delay(wallet);
    },

    requestWithdrawal: ({ amount }: WithdrawInput) => {
      const remaining = wallet.available.minorUnits - amount.minorUnits;
      wallet = { ...wallet, available: usd(Math.max(0, remaining)) };
      ledger.unshift({
        id: `l-${Date.now()}`,
        kind: 'withdrawal',
        description: 'Withdrawal to bank',
        amount: usd(-amount.minorUnits),
        date: new Date().toISOString(),
        status: 'pending',
      });
      return delay(wallet);
    },

    getBrandProfile: () =>
      delay<BrandProfile>(brandProfile()),

    updateBrandProfile: (input: UpdateBrandProfileInput) => {
      brandProfileState = {
        ...brandProfileState,
        organizationName: input.name,
        website: input.website,
        industry: input.industry,
        logoUrl: input.logoUrl,
      };
      return delay<BrandProfile>(brandProfile());
    },

    getBrandBilling: () => delay(brandBilling),

    getBrandLedger: () => delay([...brandLedger]),

    setBillingPlan: (plan: BillingPlan) => {
      brandBilling = { ...brandBilling, plan };
      return delay(brandBilling);
    },

    setBrandPaymentMethod: (input: AddPaymentMethodInput) => {
      // Stands in for the Stripe check the server does; the client already runs
      // this so the form can fail fast, but an API is never trusted for that.
      if (!luhnValid(cardDigits(input.cardNumber))) {
        throw new Error('That card number is not valid.');
      }
      brandBilling = { ...brandBilling, paymentMethodLast4: cardLast4(input.cardNumber) };
      return delay(brandBilling);
    },

    getCreatorProfile: () => delay(creatorProfile),

    updateProfile: (input: UpdateProfileInput) => {
      creatorProfile = { ...creatorProfile, ...input };
      return delay(creatorProfile);
    },

    startVerification: () => {
      creatorProfile = { ...creatorProfile, verification: 'pending' };
      return delay(creatorProfile);
    },

    connectSocial: (platform) => {
      creatorProfile = {
        ...creatorProfile,
        socialAccounts: creatorProfile.socialAccounts.map((account) =>
          account.platform === platform
            ? { ...account, connected: true, handle: account.handle || creatorProfile.handle, followers: account.followers || 12500 }
            : account,
        ),
      };
      return delay(creatorProfile);
    },

    getCreatorDirectory: () => delay([...directory]),

    inviteCreator: () => delay(undefined),

    getNotifications: () => delay([...notifications]),

    markNotificationsRead: () => {
      notifications = notifications.map((entry) => ({ ...entry, read: true }));
      return delay([...notifications]);
    },

    getNotificationPreferences: () => delay(notificationPrefs),

    updateNotificationPreferences: (prefs: NotificationPreferences) => {
      notificationPrefs = prefs;
      return delay(notificationPrefs);
    },

    getDisputes: () => delay([...disputes]),

    openDispute: ({ submissionId, reason }: OpenDisputeInput) => {
      const submission = mySubmissions.find((entry) => entry.id === submissionId);
      const dispute: Dispute = {
        id: `d-${Date.now()}`,
        submissionId,
        campaignTitle: submission?.campaignTitle ?? 'Submission',
        status: 'open',
        reason,
        createdAt: new Date().toISOString(),
        events: [{ id: `de-${Date.now()}`, author: 'You', message: reason, date: new Date().toISOString() }],
      };
      disputes.unshift(dispute);
      return delay(dispute);
    },

    generateBrief: ({ product, goal, platform }: AiBriefRequest) =>
      delay({
        brief: `Create an authentic ${platform} post featuring ${product}. Show it in a real moment of your day and explain why it fits your routine. The goal is ${goal.toLowerCase()}. Keep it natural, disclose the partnership, and end with a clear reason your audience should try it.`,
        suggestedHashtags: [`#${product.replace(/\s+/g, '')}`, '#ad', '#partner'],
      } satisfies AiBriefResult),

    generateContentIdeas: () =>
      delay({
        ideas: [
          'A 15-second “get ready with me” featuring the product in your morning routine.',
          'A before/after showing the result over a week, with honest commentary.',
          'A myth-busting clip answering a common question your audience asks.',
        ],
      } satisfies AiIdeasResult),
  };
}
