/**
 * Domain contract shared by every feature. These shapes stand in for the types the
 * generated OpenAPI SDK will export (IMPLEMENTATION_PLAN §3) — features depend on
 * this seam, never on a concrete transport.
 */
import type { Money } from '../money/money';

export type Role = 'brand' | 'creator';

export type SocialPlatform = 'instagram' | 'tiktok' | 'snapchat' | 'youtube';

export type CampaignStatus = 'draft' | 'live' | 'closed';

export type SubmissionStatus = 'pending' | 'needs_changes' | 'approved' | 'rejected';

export type SubmissionKind = 'link' | 'upload';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

/** Third-party sign-in providers (backend: POST /auth/oauth/:provider). */
export type OAuthProvider = 'google' | 'apple';

export interface Session {
  userId: string;
  role: Role;
  displayName: string;
  email: string;
  /** False right after sign-up until the emailed 6-digit code is confirmed. */
  emailVerified: boolean;
  hasOrganization?: boolean;
  /** False until a creator completes the first-run profile setup screen. */
  hasCreatorProfile?: boolean;
}

export interface BrandSetupInput {
  name: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
}

export interface CreatorSetupInput {
  displayName: string;
  username: string;
  avatarUrl?: string;
  platforms: SocialPlatform[];
}

/** What the backend says after sending a one-time code, e.g. "We sent a 6-digit code to a***@gmail.com." */
export interface CodeSent {
  message: string;
}

export interface OAuthSignInInput {
  provider: OAuthProvider;
  /** The provider-issued ID token obtained on-device by the native SDK. */
  idToken: string;
  /**
   * Used only when this is a brand-new account; ignored for returning users. Left out,
   * a new account is refused with ACCOUNT_TYPE_REQUIRED so the user can choose.
   */
  role?: Role;
}

/** Which screen asked for a code: sign-in refuses an address with no account. */
export type SignInIntent = 'sign_in' | 'sign_up';

// -------------------------------------------------------------------------------------
// Campaigns
// -------------------------------------------------------------------------------------

export interface ReferenceMaterial {
  id: string;
  name: string;
  url: string;
}

export interface CampaignRequirements {
  hashtags: string[];
  mentions: string[];
  /** Free-form must-follow rules, e.g. "Show the product in the first 3 seconds". */
  contentRules: string[];
  disclosureRequired: boolean;
  notes?: string;
}

export interface CampaignCategory {
  id: string;
  name: string;
  slug: string;
}

export type CampaignContentType = 'ugc' | 'clipping';

export interface CampaignFunding {
  fundingId: string;
  status: 'pending' | 'succeeded' | 'failed';
  amount: Money;
  /** Platform fee charged on top of the budget, per the brand's plan. */
  fee: Money;
  /** Stripe's hosted payment page; absent when the payment settled without it. */
  checkoutUrl?: string;
}

export interface Campaign {
  id: string;
  title: string;
  brandName: string;
  /** The primary (first) platform. */
  platform: SocialPlatform;
  /** Every platform creators may post on. */
  platforms: SocialPlatform[];
  contentType?: CampaignContentType;
  category?: CampaignCategory;
  endDate?: string;
  coverImageUrl?: string;
  /** How creators are paid: per 1,000 verified views, or a fixed amount per approved post. */
  rewardType: RewardType;
  /** The reward amount: per 1,000 views, or per approved post (see `rewardType`). */
  ratePerThousandViews: Money;
  goals?: string;
  audience?: string;
  startDate?: string;
  /** Total reward budget the brand committed. */
  budget: Money;
  /** Amount already paid out to creators; spend never exceeds `budget`. */
  budgetSpent: Money;
  /** Maximum a single creator can earn from this campaign. */
  perCreatorCap: Money;
  status: CampaignStatus;
  brief: string;
  requirements: CampaignRequirements;
  submissionCount: number;
  referenceMaterials: ReferenceMaterial[];
}

/** Contract §1.5: one earnings method per campaign. */
export type RewardType = 'per_view' | 'per_item';

/** Public campaigns appear in Discover; invite-only ones are reachable only by invited creators. */
export type CampaignVisibility = 'public' | 'private';

export interface CreateCampaignInput {
  title: string;
  platforms: SocialPlatform[];
  contentType: CampaignContentType;
  visibility: CampaignVisibility;
  categoryId?: string;
  /** Defaults to now when not chosen. */
  startDate?: string;
  endDate: string;
  coverImageUrl?: string;
  brief: string;
  goals?: string;
  audience?: string;
  rewardType: RewardType;
  ratePerThousandViews: Money;
  budget: Money;
  perCreatorCap: Money;
  requirements: CampaignRequirements;
  referenceMaterials?: ReferenceMaterial[];
}

/** What a brand can still change on a campaign; live campaigns keep their money and reward terms. */
export interface UpdateCampaignInput {
  campaignId: string;
  title?: string;
  brief?: string;
  goals?: string;
  audience?: string;
  contentRules?: string[];
  hashtags?: string[];
  mentions?: string[];
  endDate?: string;
}

export interface FundCampaignInput {
  campaignId: string;
  amount: Money;
  /** Which client is paying; decides where Stripe's return page leads. */
  client: 'web' | 'app';
}

// -------------------------------------------------------------------------------------
// Submissions
// -------------------------------------------------------------------------------------

/** A single creator's entry against a campaign, as a brand reviews it. */
export interface Submission {
  id: string;
  campaignId: string;
  creatorId: string;
  creatorHandle: string;
  /** The creator's display name, when the backend could resolve it. */
  creatorName?: string;
  creatorAvatarUrl?: string;
  /** The post is on a platform account the creator verified by signing in. */
  accountVerified?: boolean;
  /** A fraud review is stopping this creator's new earnings on the campaign. */
  earningsPaused?: boolean;
  /** Engagement risk worked out from the latest readings. */
  risk?: RiskLevel;
  postUrl: string;
  kind: SubmissionKind;
  views: number;
  earning: Money;
  status: SubmissionStatus;
  rejectionReason?: string;
  /** What the brand asked to change, while the submission is waiting for a revision. */
  changeRequest?: string;
  /** Fraud/risk hold on the payout for this submission (contract §1.8). */
  onHold?: boolean;
  holdReason?: string;
}

/** A creator's own submission, carrying the campaign context they need to see. */
export interface CreatorSubmission extends Submission {
  campaignTitle: string;
  brandName: string;
  /** The brand's fraud review has paused new earnings on this campaign. */
  earningsPaused?: boolean;
  /** How much of the per-creator cap this submission has reached. */
  cap: Money;
  capReached: boolean;
}

export type ReviewDecision = 'approve' | 'reject' | 'request_changes';

export interface ReviewSubmissionInput {
  submissionId: string;
  decision: ReviewDecision;
  reason?: string;
}

/** Platforms a creator authorises through the platform's own OAuth screen. */
export type ConnectablePlatform = 'instagram' | 'tiktok' | 'youtube' | 'snapchat';

export interface RecordViewsInput {
  submissionId: string;
  views: number;
}

/** What happened when views were recorded or synced for one submission. */
export interface ViewTrackingOutcome {
  status: 'recorded' | 'unavailable';
  views?: number;
  /** Why the platform could not be read, when `status` is `unavailable`. */
  message?: string;
}

export interface ResubmitInput {
  submissionId: string;
  postUrl: string;
  kind: SubmissionKind;
}

export interface SubmitParticipationInput {
  campaignId: string;
  postUrl: string;
  kind: SubmissionKind;
}

// -------------------------------------------------------------------------------------
// Dashboard
// -------------------------------------------------------------------------------------

export interface DashboardStat {
  value: string;
  label: string;
  caption?: string;
}

export interface BrandDashboard {
  greetingName: string;
  stats: DashboardStat[];
  activeCampaigns: Campaign[];
}

// -------------------------------------------------------------------------------------
// Wallet & payments
// -------------------------------------------------------------------------------------

export type LedgerEntryKind = 'earning' | 'withdrawal' | 'funding' | 'hold' | 'release';

export interface WalletSummary {
  available: Money;
  pending: Money;
  held: Money;
  lifetimeEarned: Money;
  payoutConnected: boolean;
  /** Identity check run by the payment provider during payout setup (contract §1.5). */
  identityStatus?: 'not_started' | 'in_progress' | 'verified';
}

/** Brand-side wallet movement: money in from a top-up, out to fund a campaign. */
export type BrandLedgerKind = 'topup' | 'campaign';

export interface BrandLedgerEntry {
  id: string;
  kind: BrandLedgerKind;
  description: string;
  /** Positive for a top-up, negative when a campaign is funded. */
  amount: Money;
  /** ISO date. */
  date: string;
}

export interface LedgerEntry {
  id: string;
  kind: LedgerEntryKind;
  description: string;
  amount: Money;
  /** ISO date. */
  date: string;
  status: 'completed' | 'pending' | 'held';
}

export interface WithdrawInput {
  amount: Money;
}

export type BillingPlan = 'Starter' | 'Growth' | 'Scale';

/** A subscription tier and what it allows (the backend's plan catalog). */
export interface BillingPlanDetails {
  plan: BillingPlan;
  /** Monthly price; zero for the free tier. */
  priceUsd: Money;
  priceSar: Money;
  /** Campaigns that may be live at once; null = unlimited. */
  maxActiveCampaigns: number | null;
  /** Fee on top of each campaign budget, as a percentage (e.g. 10). */
  platformFeePercent: number;
  allowsPrivateCampaigns: boolean;
  /** Whether it can be bought now (paid tiers with a Stripe price). */
  purchasable: boolean;
}

export interface BrandBilling {
  plan: BillingPlan;
  monthlySpend: Money;
  totalFunded: Money;
  paymentMethodLast4?: string;
  /** Platform fee added on top of each campaign budget at checkout, in basis points. */
  platformFeeBps?: number;
}

/** A hosted (Stripe) page the client must open to finish a flow: payout setup, card entry, checkout. */
export interface RedirectUrl {
  url: string;
}

// -------------------------------------------------------------------------------------
// Profile, verification, socials
// -------------------------------------------------------------------------------------

export interface SocialAccount {
  platform: SocialPlatform;
  handle: string;
  connected: boolean;
  /** The creator proved they own this account by signing in to the platform. */
  verified: boolean;
  followers: number;
}

export interface CreatorProfile {
  handle: string;
  /** The unique username without the leading @, as edited in the profile form. */
  username: string;
  /** Uploaded during setup or edited later; absent until the user adds one. */
  avatarUrl?: string;
  displayName: string;
  bio: string;
  categories: string[];
  verification: VerificationStatus;
  /** Why a verification request was not approved, when it was not. */
  verificationNote?: string;
  socialAccounts: SocialAccount[];
  payoutConnected: boolean;
}

export interface UpdateProfileInput {
  displayName: string;
  /** Without the leading @. */
  username?: string;
  bio?: string;
  /** A new photo's URL; omitted to leave the current one. */
  avatarUrl?: string;
}

export interface TeamMember {
  /** The membership id, used to change the role or remove the member. */
  id: string;
  userId: string;
  name: string;
  email: string;
  role: TeamRole;
}

export type TeamRole = 'Owner' | 'Member';

export interface InviteTeamMemberInput {
  email: string;
  role: TeamRole;
}

export interface BrandProfile {
  organizationName: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
  plan: string;
  teamMembers: TeamMember[];
}

export interface UpdateBrandProfileInput {
  name: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
}

// -------------------------------------------------------------------------------------
// Brand-side discovery & invitations
// -------------------------------------------------------------------------------------

export interface CreatorDirectoryEntry {
  id: string;
  handle: string;
  avatarUrl?: string;
  displayName: string;
  platforms: SocialPlatform[];
  categories: string[];
  followers: number;
  averageViews: number;
  /** Zeyoo-verified creator (profile review passed). */
  verified: boolean;
}

/** A creator as a brand sees them when weighing an application. */
export interface CreatorPublicProfile {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  /** ISO 3166-1 alpha-2, e.g. "SA". */
  country?: string;
  /** Zeyoo-verified creator (profile review passed). */
  verified: boolean;
  accounts: { platform: SocialPlatform; handle: string; verified: boolean }[];
  trackRecord: {
    /** Campaigns a brand approved them to join. */
    campaignsJoined: number;
    /** Posts brands approved. */
    approvedSubmissions: number;
    memberSince: string;
  };
}

export interface CreatorDirectoryFilter {
  platform?: SocialPlatform;
  verifiedOnly?: boolean;
}

export interface InviteCreatorInput {
  campaignId: string;
  /** Invite a creator found in the directory... */
  creatorId?: string;
  /** ...or one the brand already knows, by the email they signed up with. */
  email?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export interface CampaignInvitation {
  id: string;
  campaignId: string;
  creatorId: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  status: InvitationStatus;
}

export interface RevokeInvitationInput {
  campaignId: string;
  invitationId: string;
}

// -------------------------------------------------------------------------------------
// Notifications
// -------------------------------------------------------------------------------------

export type NotificationType = 'submission' | 'payout' | 'campaign' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  date: string;
  read: boolean;
  /** Path of the page it is about (e.g. /brand/campaigns/<id>); absent for older ones. */
  link?: string;
}

export interface NotificationPreferences {
  /** Whether notifications are also delivered as push messages to this person's devices. */
  pushEnabled: boolean;
  /** Whether notifications are also emailed (contract §1.6). */
  emailEnabled: boolean;
  submissionUpdates: boolean;
  payoutUpdates: boolean;
  campaignInvites: boolean;
  productNews: boolean;
}

// -------------------------------------------------------------------------------------
// Disputes
// -------------------------------------------------------------------------------------

export type DisputeStatus = 'open' | 'in_review' | 'upheld' | 'denied';

export type DisputeSubjectType = 'submission' | 'campaign' | 'withdrawal' | 'fraud_case' | 'other';

export interface DisputeEvent {
  id: string;
  author: 'you' | 'support' | 'other';
  message: string;
  date: string;
}

export interface Dispute {
  id: string;
  /** When support has promised a first reply by. */
  responseDueAt: string;
  escalatedAt?: string;
  /** Unanswered and past the response time. */
  overdue: boolean;
  /** The person who opened it may escalate it now. */
  canEscalate: boolean;
  subjectType: DisputeSubjectType;
  subjectId?: string;
  /** What the dispute is about, in words: a campaign title, "Withdrawal", ... */
  title: string;
  status: DisputeStatus;
  reason: string;
  createdAt: string;
  openedByName: string;
  events: DisputeEvent[];
}

export interface OpenDisputeInput {
  subjectType: DisputeSubjectType;
  subjectId?: string;
  reason: string;
}

export interface DecideDisputeInput {
  disputeId: string;
  outcome: 'upheld' | 'denied';
  note: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

/** open: earnings paused · confirmed: problem confirmed, earnings stay stopped · cleared: earnings resume. */
export type FraudCaseStatus = 'open' | 'confirmed' | 'cleared';

export interface FraudCase {
  id: string;
  campaignId: string;
  campaignTitle: string;
  creatorId: string;
  creatorName: string;
  level: RiskLevel;
  status: FraudCaseStatus;
  note?: string;
  createdAt: string;
}

export interface FlagCreatorInput {
  campaignId: string;
  creatorId: string;
  level: RiskLevel;
  note?: string;
}

export interface CampaignReport {
  campaignId: string;
  title: string;
  currency: string;
  budget: Money;
  funded: Money;
  spent: Money;
  totalViews: number;
  /** Cost of 1,000 views so far, or absent before any views. */
  costPerThousandViews?: Money;
  applications: { total: number; approved: number };
  submissions: { total: number; approved: number };
  topCreators: { creatorId: string; name: string; views: number; earned: Money; paused: boolean }[];
}

// -------------------------------------------------------------------------------------
// AI assistants
// -------------------------------------------------------------------------------------

export interface AiBriefRequest {
  product: string;
  goal: string;
  platform: SocialPlatform;
}

export interface AiBriefResult {
  brief: string;
  suggestedHashtags: string[];
}

export interface AiIdeasRequest {
  campaignId: string;
}

export interface AiIdeasResult {
  ideas: string[];
}

// -------------------------------------------------------------------------------------
// Admin console
// -------------------------------------------------------------------------------------

export interface MoneyTotal {
  currencyCode: string;
  amountMinor: number;
}

export interface AdminOverview {
  users: { creators: number; brands: number; suspended: number; joinedLast7Days: number };
  organizations: number;
  campaigns: { draft: number; published: number; closed: number };
  money: { funded: MoneyTotal[]; paidOut: MoneyTotal[]; creatorEarnings: MoneyTotal[] };
  queues: {
    withdrawalsRequested: number;
    withdrawalsHeld: number;
    disputesActive: number;
    fraudCasesOpen: number;
    verificationsPending: number;
  };
}

export type AdminUserType = 'BRAND_USER' | 'CREATOR' | 'ADMIN';
export type AdminUserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  type: AdminUserType;
  status: AdminUserStatus;
  createdAt: string;
  displayName: string | null;
  organizationName: string | null;
}

export interface AdminUserQuery {
  search?: string;
  type?: AdminUserType;
  status?: AdminUserStatus;
}

export interface AdminOrganization {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  createdAt: string;
  ownerEmail: string | null;
  memberCount: number;
  campaignCount: number;
  funded: MoneyTotal[];
}

export type AdminCampaignStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCampaign {
  id: string;
  title: string;
  organizationName: string;
  status: AdminCampaignStatus;
  currencyCode: string;
  budgetMinor: number;
  fundedMinor: number;
  paidToCreatorsMinor: number;
  refundedMinor: number;
  /** Unspent budget a closed or draft campaign can still return to the brand. */
  refundableMinor: number;
  submissionCount: number;
  createdAt: string;
  publishedAt: string | null;
}

export interface AdminFunding {
  id: string;
  campaignTitle: string;
  organizationName: string;
  amountMinor: number;
  currencyCode: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  reference: string;
  createdAt: string;
}

export type AdminWithdrawalStatus = 'REQUESTED' | 'HELD' | 'PAID' | 'REJECTED';

export interface AdminWithdrawal {
  id: string;
  creatorName: string;
  creatorEmail: string | null;
  amountMinor: number;
  currencyCode: string;
  status: AdminWithdrawalStatus;
  holdReason: string | null;
  destinationAccountId: string | null;
  transferId: string | null;
  decidedByEmail: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface AdminAuditEntry {
  id: string;
  adminEmail: string | null;
  method: string;
  route: string;
  params: Record<string, string> | null;
  body: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
}

export interface AdminVerification {
  userId: string;
  displayName: string;
  username: string;
  email: string | null;
  country: string | null;
  headline: string | null;
  bio: string | null;
  requestedAt: string;
  accounts: { platform: string; handle: string; verified: boolean }[];
}

/** Back-office roles. Super admin is the only one for now. */
export type StaffRole = 'SUPER_ADMIN';

export type StaffStatus = 'ACTIVE' | 'DEACTIVATED';

/** The signed-in back-office account; a separate identity from an app {@link Session}. */
export interface StaffSession {
  staffId: string;
  email: string;
  role: StaffRole;
}

export interface AdminStaff {
  id: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  lastSignInAt: string | null;
  createdAt: string;
  isYou: boolean;
}

export interface AdminUserDetail {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    type: AdminUserType;
    status: AdminUserStatus;
    emailVerified: boolean;
    createdAt: string;
  };
  creator: {
    displayName: string;
    username: string;
    country: string | null;
    headline: string | null;
    bio: string | null;
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    verificationNote: string | null;
    accounts: { platform: string; handle: string; verified: boolean }[];
    payoutConnected: boolean;
    wallet: {
      available: Money;
      pending: Money;
      held: Money;
      lifetimeEarned: Money;
    } | null;
    submissions: { total: number; approved: number };
    earnings: { campaignTitle: string; accruedMinor: number; currencyCode: string; paused: boolean }[];
    withdrawals: { id: string; amountMinor: number; currencyCode: string; status: string; createdAt: string }[];
  } | null;
  organizations: {
    id: string;
    name: string;
    role: string;
    campaignCount: number;
    funded: MoneyTotal[];
    subscription: { planKey: string; status: string } | null;
  }[];
  disputes: { id: string; subjectType: string; status: string; reason: string; createdAt: string }[];
  fraudCases: { id: string; campaignTitle: string; level: string; status: string; createdAt: string }[];
}

export interface AdminBilling {
  plans: {
    key: string;
    name: string;
    priceMinor: number;
    currencyCode: string;
    connectedToStripe: boolean;
    subscribers: number;
  }[];
  subscriptions: {
    id: string;
    organizationName: string;
    planName: string;
    status: string;
    since: string;
  }[];
  summary: {
    active: number;
    pastDue: number;
    canceled: number;
    incomplete: number;
    organizationsWithCard: number;
  };
}

export interface AdminRefundOutcome {
  refundedMinor: number;
  currencyCode: string;
  refunds: number;
}

// -------------------------------------------------------------------------------------
// Applications & invitations
// -------------------------------------------------------------------------------------

export type ApplicationStatus = 'pending' | 'approved' | 'declined' | 'withdrawn';

/** A creator's own application to a campaign. */
export interface MyApplication {
  id: string;
  campaignId: string;
  campaignTitle: string;
  status: ApplicationStatus;
  fromInvitation: boolean;
  message?: string;
  createdAt: string;
}

/** An application as the brand sees it, with who applied. */
export interface CampaignApplication {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatarUrl?: string;
  status: ApplicationStatus;
  fromInvitation: boolean;
  message?: string;
  createdAt: string;
}

export interface ApplyToCampaignInput {
  campaignId: string;
  message?: string;
}

export interface ReviewApplicationInput {
  campaignId: string;
  applicationId: string;
  approve: boolean;
}

/** A private-campaign invitation waiting for the creator's answer. */
export interface CreatorInvitation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  platform: Campaign['platform'];
  createdAt: string;
}

// -------------------------------------------------------------------------------------
// Video uploads (submission content, contract §1.3 "upload or link")
// -------------------------------------------------------------------------------------

export type VideoContentType = 'video/mp4' | 'video/quicktime' | 'video/webm';

/** Where to PUT the video bytes, and the URL the video will have once uploaded. */
export interface VideoUploadTicket {
  id: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  url: string;
}

export interface UploadedVideo {
  id: string;
  url: string;
  contentType: string;
  size: number;
}
