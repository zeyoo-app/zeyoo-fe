import type {
  CodeSent,
  RedirectUrl,
  AiBriefRequest,
  AiBriefResult,
  AiIdeasRequest,
  AiIdeasResult,
  AppNotification,
  BillingPlan,
  BrandBilling,
  BrandDashboard,
  BrandLedgerEntry,
  BrandProfile,
  BrandSetupInput,
  Campaign,
  CampaignCategory,
  CampaignFunding,
  CreateCampaignInput,
  CreatorDirectoryEntry,
  CreatorProfile,
  CreatorSetupInput,
  CreatorSubmission,
  Dispute,
  FundCampaignInput,
  InviteCreatorInput,
  LedgerEntry,
  NotificationPreferences,
  OAuthSignInInput,
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
 * The single backend interface every feature talks to. The HTTP adapter implements
 * this contract, while features receive it through `useApi()` and never construct
 * their own transport.
 */
export interface ZeyooApi {
  /** Email a one-time code for sign-in or sign-up (backend: POST /auth/email/code). */
  requestEmailCode(input: { email: string }): Promise<CodeSent>;
  /** Verify an emailed code, creating the account when the address is new (backend: POST /auth/email/code/verify). */
  verifyEmailCode(input: { email: string; code: string; role: Role }): Promise<Session>;
  /** Text a one-time code (backend: POST /auth/phone/code). */
  requestPhoneCode(input: { phone: string }): Promise<CodeSent>;
  /** Verify a texted code, creating the account when the number is new. */
  verifyPhoneCode(input: { phone: string; code: string; role: Role }): Promise<Session>;
  /** Sign in (or sign up) with a Google/Apple ID token (backend: POST /auth/oauth/:provider). */
  oauthSignIn(input: OAuthSignInInput): Promise<Session>;

  /** First-run brand setup, completed as step 3 of sign-up (backend: POST /organizations). */
  setupBrand(input: BrandSetupInput): Promise<Session>;
  /** First-run creator setup, completed as step 3 of sign-up. */
  setupCreator(input: CreatorSetupInput): Promise<Session>;

  // Campaigns (shared reads; brand writes)
  getBrandDashboard(): Promise<BrandDashboard>;
  getBrandCampaigns(): Promise<Campaign[]>;
  getCampaign(campaignId: string): Promise<Campaign>;
  getCampaignCategories(): Promise<CampaignCategory[]>;
  createCampaign(input: CreateCampaignInput): Promise<Campaign>;
  fundCampaign(input: FundCampaignInput): Promise<CampaignFunding>;
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
  connectPayout(): Promise<RedirectUrl>;
  requestWithdrawal(input: WithdrawInput): Promise<WalletSummary>;

  // Brand billing
  getBrandBilling(): Promise<BrandBilling>;
  /** Money movements on the brand wallet: top-ups in, campaign funding out. */
  getBrandLedger(): Promise<BrandLedgerEntry[]>;
  setBillingPlan(plan: BillingPlan): Promise<RedirectUrl>;
  setBrandPaymentMethod(): Promise<RedirectUrl>;

  // Profile, verification, socials
  getBrandProfile(): Promise<BrandProfile>;
  updateBrandProfile(input: UpdateBrandProfileInput): Promise<BrandProfile>;
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
