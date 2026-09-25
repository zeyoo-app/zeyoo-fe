/**
 * Domain contract shared by every feature. These shapes stand in for the types the
 * generated OpenAPI SDK will export (IMPLEMENTATION_PLAN §3) — features depend on
 * this seam, never on a concrete transport. Swapping the mock for the real client
 * means satisfying `ZeyooApi` (./ZeyooApi.ts); nothing else changes.
 */
import type { Money } from '../money/money';

export type Role = 'brand' | 'creator';

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube';

export type CampaignStatus = 'draft' | 'live' | 'closed';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type SubmissionKind = 'link' | 'upload';

export type VerificationStatus = 'unverified' | 'pending' | 'verified';

/** Third-party sign-in providers (backend: POST /auth/oauth/:provider). */
export type OAuthProvider = 'google' | 'apple';

export interface Session {
  userId: string;
  role: Role;
  displayName: string;
  /** False right after sign-up until the emailed 6-digit code is confirmed. */
  emailVerified: boolean;
}

export interface VerifyEmailInput {
  code: string;
}

export interface RequestPasswordResetInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface OAuthSignInInput {
  provider: OAuthProvider;
  /** The provider-issued ID token obtained on-device by the native SDK. */
  idToken: string;
  /** Used only when this is a brand-new account; ignored for returning users. */
  role: Role;
}

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
  disclosureRequired: boolean;
  notes?: string;
}

export interface Campaign {
  id: string;
  title: string;
  brandName: string;
  platform: SocialPlatform;
  ratePerThousandViews: Money;
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

export interface CreateCampaignInput {
  title: string;
  platform: SocialPlatform;
  brief: string;
  ratePerThousandViews: Money;
  budget: Money;
  perCreatorCap: Money;
  requirements: CampaignRequirements;
}

// -------------------------------------------------------------------------------------
// Submissions
// -------------------------------------------------------------------------------------

/** A single creator's entry against a campaign, as a brand reviews it. */
export interface Submission {
  id: string;
  campaignId: string;
  creatorHandle: string;
  postUrl: string;
  kind: SubmissionKind;
  views: number;
  earning: Money;
  status: SubmissionStatus;
  rejectionReason?: string;
  /** Fraud/risk hold on the payout for this submission (contract §1.8). */
  onHold?: boolean;
  holdReason?: string;
}

/** A creator's own submission, carrying the campaign context they need to see. */
export interface CreatorSubmission extends Submission {
  campaignTitle: string;
  brandName: string;
  /** How much of the per-creator cap this submission has reached. */
  cap: Money;
  capReached: boolean;
}

export type ReviewDecision = 'approve' | 'reject';

export interface ReviewSubmissionInput {
  submissionId: string;
  decision: ReviewDecision;
  reason?: string;
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

export interface BrandBilling {
  plan: BillingPlan;
  monthlySpend: Money;
  totalFunded: Money;
  paymentMethodLast4?: string;
}

// -------------------------------------------------------------------------------------
// Profile, verification, socials
// -------------------------------------------------------------------------------------

export interface SocialAccount {
  platform: SocialPlatform;
  handle: string;
  connected: boolean;
  followers: number;
}

export interface CreatorProfile {
  handle: string;
  displayName: string;
  bio: string;
  categories: string[];
  verification: VerificationStatus;
  socialAccounts: SocialAccount[];
  payoutConnected: boolean;
}

export interface UpdateProfileInput {
  displayName: string;
  bio: string;
  categories: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member';
}

export interface BrandProfile {
  organizationName: string;
  plan: string;
  teamMembers: TeamMember[];
}

// -------------------------------------------------------------------------------------
// Brand-side discovery & invitations
// -------------------------------------------------------------------------------------

export interface CreatorDirectoryEntry {
  id: string;
  handle: string;
  displayName: string;
  platforms: SocialPlatform[];
  categories: string[];
  followers: number;
  averageViews: number;
}

export interface InviteCreatorInput {
  creatorId: string;
  campaignId: string;
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
}

export interface NotificationPreferences {
  submissionUpdates: boolean;
  payoutUpdates: boolean;
  campaignInvites: boolean;
  productNews: boolean;
}

// -------------------------------------------------------------------------------------
// Disputes
// -------------------------------------------------------------------------------------

export type DisputeStatus = 'open' | 'in_review' | 'resolved';

export interface DisputeEvent {
  id: string;
  author: string;
  message: string;
  date: string;
}

export interface Dispute {
  id: string;
  submissionId: string;
  campaignTitle: string;
  status: DisputeStatus;
  reason: string;
  createdAt: string;
  events: DisputeEvent[];
}

export interface OpenDisputeInput {
  submissionId: string;
  reason: string;
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
