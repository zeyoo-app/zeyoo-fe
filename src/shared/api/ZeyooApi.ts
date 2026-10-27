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
  AdminAuditEntry,
  AdminBilling,
  AdminPage,
  AdminRefundOutcome,
  AdminStaff,
  StaffSession,
  AdminUserDetail,
  AdminVerification,
  AdminCampaign,
  AdminCampaignStatus,
  AdminCategory,
  AdminFunding,
  AdminOrganization,
  AdminOverview,
  AdminUser,
  AdminUserQuery,
  AdminWithdrawal,
  CampaignReport,
  DecideDisputeInput,
  Dispute,
  FlagCreatorInput,
  FraudCase,
  FundCampaignInput,
  CampaignInvitation,
  InviteCreatorInput,
  RevokeInvitationInput,
  LedgerEntry,
  NotificationPreferences,
  OAuthSignInInput,
  SignInIntent,
  OpenDisputeInput,
  ConnectablePlatform,
  RecordViewsInput,
  ReviewSubmissionInput,
  ViewTrackingOutcome,
  Role,
  Session,
  Submission,
  SubmitParticipationInput,
  ResubmitInput,
  MyApplication,
  CampaignApplication,
  ApplyToCampaignInput,
  ReviewApplicationInput,
  CreatorInvitation,
  CreatorDirectoryFilter,
  UpdateCampaignInput,
  InviteTeamMemberInput,
  TeamRole,
  VideoContentType,
  VideoUploadTicket,
  UploadedVideo,
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
  /** Email a back-office sign-in code to a staff address (backend: POST /admin/auth/code). */
  requestStaffCode(email: string): Promise<CodeSent>;
  /** Exchange a back-office code for a staff session (backend: POST /admin/auth/code/verify). */
  verifyStaffCode(input: { email: string; code: string }): Promise<StaffSession>;
  /** Email a one-time code for sign-in or sign-up (backend: POST /auth/email/code). */
  requestEmailCode(input: { email: string; intent?: SignInIntent }): Promise<CodeSent>;
  /** Verify an emailed code, creating the account when the address is new (backend: POST /auth/email/code/verify). */
  verifyEmailCode(input: { email: string; code: string; role?: Role }): Promise<Session>;
  /** Text a one-time code (backend: POST /auth/phone/code). */
  requestPhoneCode(input: { phone: string; intent?: SignInIntent }): Promise<CodeSent>;
  /** Verify a texted code, creating the account when the number is new. */
  verifyPhoneCode(input: { phone: string; code: string; role?: Role }): Promise<Session>;
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
  /** The latest funding attempt for a campaign, for waiting on a payment made elsewhere. */
  getCampaignFunding(campaignId: string): Promise<CampaignFunding | null>;
  fundCampaign(input: FundCampaignInput): Promise<CampaignFunding>;
  setCampaignStatus(input: { campaignId: string; status: Campaign['status'] }): Promise<Campaign>;
  getDiscoverCampaigns(): Promise<Campaign[]>;

  // Submissions
  getCampaignSubmissions(campaignId: string): Promise<Submission[]>;
  reviewSubmission(input: ReviewSubmissionInput): Promise<Submission>;
  deleteAccount(): Promise<void>;
  recordSubmissionViews(input: RecordViewsInput): Promise<ViewTrackingOutcome>;
  syncSubmissionViews(submissionId: string): Promise<ViewTrackingOutcome>;
  getMySubmissions(): Promise<CreatorSubmission[]>;
  submitParticipation(input: SubmitParticipationInput): Promise<CreatorSubmission>;
  /** Sends a revised post after the brand asked for changes. */
  resubmitSubmission(input: ResubmitInput): Promise<CreatorSubmission>;
  /** Reserves a direct-to-storage video upload; the bytes are PUT to `uploadUrl`. */
  startVideoUpload(input: { contentType: VideoContentType; size: number }): Promise<VideoUploadTicket>;
  /** Confirms the bytes arrived; the returned URL can then be submitted as an upload. */
  completeVideoUpload(uploadId: string): Promise<UploadedVideo>;

  /** Edits a campaign; a live one keeps its money and reward terms. */
  updateCampaign(input: UpdateCampaignInput): Promise<Campaign>;
  /** The campaign summary report as CSV text (contract §1.2). */
  getCampaignReportCsv(campaignId: string): Promise<string>;

  // Team
  inviteTeamMember(input: InviteTeamMemberInput): Promise<void>;
  updateTeamMemberRole(input: { memberId: string; role: TeamRole }): Promise<void>;
  removeTeamMember(memberId: string): Promise<void>;

  // Applications & invitations
  getMyApplications(): Promise<MyApplication[]>;
  applyToCampaign(input: ApplyToCampaignInput): Promise<MyApplication>;
  withdrawApplication(applicationId: string): Promise<void>;
  getCampaignApplications(campaignId: string): Promise<CampaignApplication[]>;
  reviewApplication(input: ReviewApplicationInput): Promise<void>;
  getMyInvitations(): Promise<CreatorInvitation[]>;
  declineInvitation(invitationId: string): Promise<void>;

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
  /** Starts the OAuth connection of an Instagram or TikTok account; returns the platform's sign-in URL. */
  startPlatformConnection(input: { platform: ConnectablePlatform; client: 'web' | 'app' }): Promise<{ authorizationUrl: string }>;
  /** Finishes the connection with the code the platform returned, and records the account on the profile. */
  completePlatformConnection(input: { code: string; state: string }): Promise<CreatorProfile>;
  connectSocial(platform: CreatorProfile['socialAccounts'][number]['platform']): Promise<CreatorProfile>;

  // Brand discovery & invitations
  getCreatorDirectory(filter?: CreatorDirectoryFilter): Promise<CreatorDirectoryEntry[]>;
  inviteCreator(input: InviteCreatorInput): Promise<void>;
  getCampaignInvitations(campaignId: string): Promise<CampaignInvitation[]>;
  revokeInvitation(input: RevokeInvitationInput): Promise<void>;

  // Notifications
  getNotifications(): Promise<AppNotification[]>;
  markNotificationsRead(): Promise<AppNotification[]>;
  getNotificationPreferences(): Promise<NotificationPreferences>;
  updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences>;

  // Disputes
  getDisputes(): Promise<Dispute[]>;
  getDispute(disputeId: string): Promise<Dispute>;
  openDispute(input: OpenDisputeInput): Promise<Dispute>;
  escalateDispute(disputeId: string): Promise<Dispute>;
  sendDisputeMessage(input: { disputeId: string; message: string }): Promise<Dispute>;

  // Fraud review
  getCampaignFraudCases(campaignId: string): Promise<FraudCase[]>;
  getMyFraudCases(): Promise<FraudCase[]>;
  flagCreator(input: FlagCreatorInput): Promise<FraudCase>;
  closeFraudCase(input: { caseId: string; action: 'confirm' | 'clear' }): Promise<FraudCase>;

  // Reporting
  getCampaignReport(campaignId: string): Promise<CampaignReport>;

  // Admin
  getAdminOverview(): Promise<AdminOverview>;
  getAdminUsers(query: AdminUserQuery & { page?: number }): Promise<AdminPage<AdminUser>>;
  getAdminUserDetail(userId: string): Promise<AdminUserDetail>;
  getAdminVerifications(page?: number): Promise<AdminPage<AdminVerification>>;
  reviewAdminVerification(input: { userId: string; approve: boolean; note?: string }): Promise<void>;
  getAdminStaff(): Promise<AdminStaff[]>;
  addAdminStaff(email: string): Promise<void>;
  setAdminStaffActive(input: { staffId: string; active: boolean }): Promise<void>;
  getAdminBilling(): Promise<AdminBilling>;
  refundAdminCampaign(campaignId: string): Promise<AdminRefundOutcome>;
  setAdminUserSuspended(input: { userId: string; suspended: boolean }): Promise<void>;
  getAdminOrganizations(page?: number): Promise<AdminPage<AdminOrganization>>;
  getAdminCampaigns(query: { status?: AdminCampaignStatus; search?: string; page?: number }): Promise<AdminPage<AdminCampaign>>;
  closeAdminCampaign(campaignId: string): Promise<void>;
  getAdminFundings(page?: number): Promise<AdminPage<AdminFunding>>;
  getAdminWithdrawals(scope: 'open' | 'history', page?: number): Promise<AdminPage<AdminWithdrawal>>;
  decideAdminWithdrawal(input: {
    withdrawalId: string;
    action: 'approve' | 'reject' | 'hold' | 'release';
    reason?: string;
  }): Promise<void>;
  getAdminCategories(): Promise<AdminCategory[]>;
  createAdminCategory(name: string): Promise<void>;
  getAdminAuditLog(page?: number): Promise<AdminPage<AdminAuditEntry>>;
  getAdminDisputes(scope: 'active' | 'closed'): Promise<Dispute[]>;
  reviewDispute(disputeId: string): Promise<Dispute>;
  decideDispute(input: DecideDisputeInput): Promise<Dispute>;
  getAdminFraudCases(status?: FraudCase['status']): Promise<FraudCase[]>;
  adminCloseFraudCase(input: { caseId: string; action: 'confirm' | 'clear' }): Promise<FraudCase>;

  // AI assistants
  generateBrief(input: AiBriefRequest): Promise<AiBriefResult>;
  generateContentIdeas(input: AiIdeasRequest): Promise<AiIdeasResult>;
}
