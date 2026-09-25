import type {
  AiBriefRequest,
  AiBriefResult,
  AiIdeasRequest,
  AiIdeasResult,
  AppNotification,
  BillingPlan,
  BrandBilling,
  BrandDashboard,
  BrandProfile,
  Campaign,
  CreateCampaignInput,
  CreatorDirectoryEntry,
  CreatorProfile,
  CreatorSubmission,
  Dispute,
  InviteCreatorInput,
  LedgerEntry,
  NotificationPreferences,
  OAuthSignInInput,
  OpenDisputeInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  ReviewSubmissionInput,
  Role,
  Session,
  Submission,
  SubmitParticipationInput,
  UpdateProfileInput,
  VerifyEmailInput,
  WalletSummary,
  WithdrawInput,
} from './types';

/**
 * The single backend interface every feature talks to. The mock in ./mockApi.ts
 * implements it today; the generated OpenAPI client implements it later. Features
 * receive it through `useApi()` and never construct their own transport.
 */
export interface ZeyooApi {
  signIn(input: { email: string; password: string }): Promise<Session>;
  /** Create an account and start an authenticated session (backend: POST /auth/register). */
  signUp(input: { email: string; password: string; role: Role }): Promise<Session>;
  /** Sign in (or sign up) with a Google/Apple ID token (backend: POST /auth/oauth/:provider). */
  oauthSignIn(input: OAuthSignInInput): Promise<Session>;
  /** Confirm the signed-in account's email with the 6-digit code (backend: POST /auth/email/verify). */
  verifyEmail(input: VerifyEmailInput): Promise<Session>;
  /** Re-send the email-verification code to the signed-in account (backend: POST /auth/email/resend). */
  resendVerificationCode(): Promise<void>;
  /** Start a password reset; always resolves so it never reveals if the email exists (backend: POST /auth/password/forgot). */
  requestPasswordReset(input: RequestPasswordResetInput): Promise<void>;
  /** Complete a password reset with the emailed code (backend: POST /auth/password/reset). */
  resetPassword(input: ResetPasswordInput): Promise<void>;

  // Campaigns (shared reads; brand writes)
  getBrandDashboard(): Promise<BrandDashboard>;
  getBrandCampaigns(): Promise<Campaign[]>;
  getCampaign(campaignId: string): Promise<Campaign>;
  createCampaign(input: CreateCampaignInput): Promise<Campaign>;
  setCampaignStatus(input: { campaignId: string; status: Campaign['status'] }): Promise<Campaign>;
  getDiscoverCampaigns(): Promise<Campaign[]>;

  // Submissions
  getCampaignSubmissions(campaignId: string): Promise<Submission[]>;
  reviewSubmission(input: ReviewSubmissionInput): Promise<Submission>;
  getMySubmissions(): Promise<CreatorSubmission[]>;
  submitParticipation(input: SubmitParticipationInput): Promise<CreatorSubmission>;

  // Wallet & payments
  getWallet(): Promise<WalletSummary>;
  getLedger(): Promise<LedgerEntry[]>;
  connectPayout(): Promise<WalletSummary>;
  requestWithdrawal(input: WithdrawInput): Promise<WalletSummary>;

  // Brand billing
  getBrandBilling(): Promise<BrandBilling>;
  setBillingPlan(plan: BillingPlan): Promise<BrandBilling>;

  // Profile, verification, socials
  getBrandProfile(): Promise<BrandProfile>;
  getCreatorProfile(): Promise<CreatorProfile>;
  updateProfile(input: UpdateProfileInput): Promise<CreatorProfile>;
  startVerification(): Promise<CreatorProfile>;
  connectSocial(platform: CreatorProfile['socialAccounts'][number]['platform']): Promise<CreatorProfile>;

  // Brand discovery & invitations
  getCreatorDirectory(): Promise<CreatorDirectoryEntry[]>;
  inviteCreator(input: InviteCreatorInput): Promise<void>;

  // Notifications
  getNotifications(): Promise<AppNotification[]>;
  markNotificationsRead(): Promise<AppNotification[]>;
  getNotificationPreferences(): Promise<NotificationPreferences>;
  updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences>;

  // Disputes
  getDisputes(): Promise<Dispute[]>;
  openDispute(input: OpenDisputeInput): Promise<Dispute>;

  // AI assistants
  generateBrief(input: AiBriefRequest): Promise<AiBriefResult>;
  generateContentIdeas(input: AiIdeasRequest): Promise<AiIdeasResult>;
}
