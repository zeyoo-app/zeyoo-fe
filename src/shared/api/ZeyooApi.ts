import type {
  AddPaymentMethodInput,
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
  CreateCampaignInput,
  CreatorDirectoryEntry,
  CreatorProfile,
  CreatorSetupInput,
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
  UpdateBrandProfileInput,
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
  /** Request a one-time sign-in code (backend: POST /auth/login/code). */
  requestSignInCode(input: { email: string }): Promise<void>;
  /** Exchange an emailed sign-in code for a session (backend: POST /auth/login/code/verify). */
  signInWithCode(input: { email: string; code: string }): Promise<Session>;
  /** Create an account and start an authenticated session (backend: POST /auth/register). */
  signUp(input: { email: string; role: Role }): Promise<Session>;
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
  /** Money movements on the brand wallet: top-ups in, campaign funding out. */
  getBrandLedger(): Promise<BrandLedgerEntry[]>;
  setBillingPlan(plan: BillingPlan): Promise<BrandBilling>;
  setBrandPaymentMethod(input: AddPaymentMethodInput): Promise<BrandBilling>;

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
