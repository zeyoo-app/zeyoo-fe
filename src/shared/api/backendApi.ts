import { SESSION_EXPIRED_EVENT, STAFF_SESSION_EXPIRED_EVENT } from '../auth/sessionEvents';
import type { Money } from '../money/money';
import type { ZeyooApi } from './ZeyooApi';
import { ApiError } from './errors';
import type {
  Role,
  TeamMember,
  CampaignApplication,
  CreatorInvitation,
  MyApplication,
  UploadedVideo,
  VideoUploadTicket,
  CodeSent,
  Campaign,
  CampaignCategory,
  CampaignFunding,
  CampaignRequirements,
  CampaignInvitation,
  AdminAuditEntry,
  AdminBilling,
  AdminPage,
  AdminRefundOutcome,
  AdminStaff,
  AdminUserDetail,
  AdminVerification,
  AdminCampaign,
  AdminCategory,
  AdminFunding,
  AdminOrganization,
  AdminOverview,
  AdminUser,
  AdminWithdrawal,
  CampaignReport,
  CreatorProfile,
  Dispute,
  DisputeEvent,
  FraudCase,
  CreatorSubmission,
  NotificationPreferences,
  Session,
  SocialAccount,
  StaffSession,
  Submission,
  ViewTrackingOutcome,
} from './types';

interface BackendTokens { accessToken: string; refreshToken: string }
interface BackendAccount { id: string; email: string | null; phone?: string | null; type: string; emailVerifiedAt?: string | null; phoneVerifiedAt?: string | null; organizations?: { organizationId: string; name: string }[]; hasCreatorProfile?: boolean }
interface BackendOrganization { id: string; name: string; website?: string | null; industry?: string | null; logoUrl?: string | null }
interface BackendCampaign { id: string; title: string; description: string; guidelines?: string | null; platform: string; platforms?: string[]; maxRewardPerCreatorAmount?: number | null; hashtags?: string[]; mentions?: string[]; referenceMaterials?: { name: string; url: string }[]; status: string; currencyCode: string; budgetAmount: number; rewardAmount: number; organization?: { name?: string }; organizationId: string; categoryId?: string | null; startDate?: string; endDate?: string; rewardType?: string; goals?: string | null; audience?: string | null; contentType?: string; coverImageUrl?: string | null }
interface BackendFunding { fundingId: string; checkoutUrl?: string | null; amountMinor: number; currencyCode: string; status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' }
interface BackendProfile { displayName: string; username?: string; avatarUrl?: string | null; headline?: string | null; bio?: string | null; verificationStatus?: string; verificationNote?: string | null }
interface BackendSubmission {
  id: string; campaignId: string; status: string; creatorUserId: string;
  revisions?: { contentType: string; contentUrl: string }[];
  reviews?: { decision: string; note: string | null; createdAt: string }[];
  creator?: { displayName: string; username: string; avatarUrl: string | null } | null;
  accountVerified?: boolean;
}
interface BackendInvitation {
  id: string; campaignId: string; creatorUserId: string; status: string;
  creator?: { displayName: string; username: string; avatarUrl: string | null } | null;
}
interface BackendSocialAccount { platform: string; handle: string; status: string; verifiedAt?: string | null }
interface BackendCreatorCampaignEarnings { campaignId: string; campaignTitle: string; currencyCode: string; views: number; accruedMinor: number; capMinor: number | null; paused: boolean }

const ZERO_USD: Money = { minorUnits: 0, currency: 'USD' };

/** Platforms the backend only connects through the platform's own sign-in, never a typed handle. */
const VERIFIED_ONLY_PLATFORMS: readonly string[] = ['instagram', 'tiktok', 'youtube', 'snapchat'];

interface BackendStaff { id: string; email: string; role: StaffSession['role'] }

/**
 * Where a client keeps its session. The app and the back office each have their own
 * refresh cookie (behind `sessionRoutes`) and their own expiry event, so signing out
 * of one never touches the other.
 */
export interface SessionChannel {
  /** The Next route folder holding `refresh` and `session`, e.g. `/api/auth`. */
  routes: string;
  /** Window event fired when this session cannot be renewed. */
  expiredEvent: string;
}

export const APP_SESSION_CHANNEL: SessionChannel = { routes: '/api/auth', expiredEvent: SESSION_EXPIRED_EVENT };

export const STAFF_SESSION_CHANNEL: SessionChannel = {
  routes: '/api/admin-auth',
  expiredEvent: STAFF_SESSION_EXPIRED_EVENT,
};

export function createBackendApi(baseUrl: string, channel: SessionChannel = APP_SESSION_CHANNEL): ZeyooApi {
  const root = baseUrl.replace(/\/$/, '');

  /** The creator's profile together with their connected accounts, which live on their own endpoint. */
  async function readCreatorProfile(): Promise<CreatorProfile> {
    const [profile, accounts] = await Promise.all([
      request<BackendProfile>('GET', '/creator-profile'),
      request<BackendSocialAccount[]>('GET', '/creator-profile/social-accounts'),
    ]);
    return mapCreatorProfile(profile, accounts);
  }
  let accessToken: string | null = null;
  let refreshRequest: Promise<string | null> | null = null;
  let organizationId: string | null = null;
  let organizationName = 'Your organization';

  function resetSessionContext(): void {
    accessToken = null;
    refreshRequest = null;
    organizationId = null;
    organizationName = 'Your organization';
  }

  async function refreshAccessToken() {
    const response = await fetch(`${channel.routes}/refresh`, { method: 'POST', cache: 'no-store' });
    if (!response.ok) return null;
    const body = (await response.json()) as { accessToken: string };
    accessToken = body.accessToken;
    return accessToken;
  }

  async function token() {
    if (accessToken) return accessToken;
    refreshRequest ??= refreshAccessToken().finally(() => { refreshRequest = null; });
    return refreshRequest;
  }

  /**
   * Pickers hand back a local `data:` URL. Inlining that in a JSON body blows past
   * the API's request-size limit, so it is uploaded as a real file first and the
   * hosted URL is stored instead. Already-hosted URLs pass through untouched.
   */
  async function hostedImageUrl(url: string | undefined): Promise<string | undefined> {
    if (!url?.startsWith('data:')) return url;
    const blob = await (await fetch(url)).blob();
    const form = new FormData();
    form.append('file', blob, 'upload');
    const current = await token();
    const response = await fetch(`${root}/media/uploads/images`, {
      method: 'POST',
      headers: current ? { Authorization: `Bearer ${current}` } : {},
      body: form,
    });
    if (!response.ok) throw await apiError(response);
    return ((await response.json()) as { url: string }).url;
  }

  async function request<T>(method: string, path: string, body?: unknown, authenticate = true, allowRetry = true): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authenticate) {
      const current = await token();
      if (current) headers.Authorization = `Bearer ${current}`;
    }
    const response = await fetch(`${root}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    if (response.status === 401 && authenticate && accessToken && allowRetry) {
      accessToken = null;
      const renewed = await refreshAccessToken();
      if (renewed) return request<T>(method, path, body, true, false);
    }
    if (response.status === 401 && authenticate && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(channel.expiredEvent));
    }
    if (!response.ok) throw await apiError(response);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async function storeTokens(tokens: BackendTokens): Promise<void> {
    resetSessionContext();
    accessToken = tokens.accessToken;
    await fetch(`${channel.routes}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
  }

  async function establishSession(tokens: BackendTokens): Promise<Session> {
    await storeTokens(tokens);
    const account = await request<BackendAccount>('GET', '/me');
    rememberOrganization(account);
    return mapSession(account);
  }

  async function currentOrganizationId() {
    if (organizationId) return organizationId;
    const account = await request<BackendAccount>('GET', '/me');
    rememberOrganization(account);
    if (!organizationId) throw new Error('Your account is not connected to an organization.');
    return organizationId;
  }

  function rememberOrganization(account: BackendAccount) {
    organizationId = account.organizations?.[0]?.organizationId ?? null;
    organizationName = account.organizations?.[0]?.name ?? organizationName;
  }

  async function listBrandCampaigns() {
    const id = await currentOrganizationId();
    const data = await request<BackendCampaign[]>('GET', `/organizations/${id}/campaigns`);
    return data.map((campaign) => mapCampaign(campaign, organizationName));
  }

  return {
    resetSession: resetSessionContext,
    async requestStaffCode(email) { return request<CodeSent>('POST', '/admin/auth/code', { email }, false); },
    async verifyStaffCode({ email, code }) {
      await storeTokens(await request<BackendTokens>('POST', '/admin/auth/code/verify', { email, code }, false));
      const staff = await request<BackendStaff>('GET', '/admin/auth/me');
      return { staffId: staff.id, email: staff.email, role: staff.role };
    },
    async requestEmailCode({ email, intent }) { return request<CodeSent>('POST', '/auth/email/code', { email, intent }, false); },
    async verifyEmailCode({ email, code, role }) {
      return establishSession(await request<BackendTokens>('POST', '/auth/email/code/verify', {
        email, code, userType: userTypeOf(role),
      }, false));
    },
    async requestPhoneCode({ phone, intent }) { return request<CodeSent>('POST', '/auth/phone/code', { phone, intent }, false); },
    async verifyPhoneCode({ phone, code, role }) {
      return establishSession(await request<BackendTokens>('POST', '/auth/phone/code/verify', {
        phone, code, userType: userTypeOf(role),
      }, false));
    },
    async oauthSignIn({ provider, idToken, role }) {
      return establishSession(await request<BackendTokens>('POST', `/auth/oauth/${provider}`, {
        idToken, userType: userTypeOf(role),
      }, false));
    },
    async setupBrand(input) {
      const organization = await request<BackendOrganization>('POST', '/organizations', { ...input, logoUrl: await hostedImageUrl(input.logoUrl) });
      organizationId = organization.id;
      organizationName = organization.name;
      return mapSession(await request<BackendAccount>('GET', '/me'));
    },
    async setupCreator(input) {
      await request('POST', '/creator-profile', { displayName: input.displayName, username: input.username, avatarUrl: await hostedImageUrl(input.avatarUrl) });
      await Promise.all(input.platforms.filter((platform) => !VERIFIED_ONLY_PLATFORMS.includes(platform)).map((platform) => request('POST', '/creator-profile/social-accounts', { platform: platform.toUpperCase(), handle: `@${input.username}` })));
      return mapSession(await request<BackendAccount>('GET', '/me'));
    },
    async getBrandDashboard() {
      const campaigns = await listBrandCampaigns();
      const active = campaigns.filter((campaign) => campaign.status === 'live');
      return { greetingName: organizationName, stats: [
        { value: String(active.length), label: 'Active Campaigns' },
        { value: String(campaigns.reduce((sum, campaign) => sum + campaign.submissionCount, 0)), label: 'Pending Submissions' },
        { value: '0', label: 'Total Verified Views' },
        { value: '$0', label: 'Creator Rewards Paid' },
      ], activeCampaigns: active };
    },
    getBrandCampaigns: listBrandCampaigns,
    async getCampaign(campaignId) { return mapCampaign(await request<BackendCampaign>('GET', `/campaigns/${campaignId}`), organizationName); },
    async getCampaignCategories() { return request<CampaignCategory[]>('GET', '/campaign-categories', undefined, false); },
    async createCampaign(input) {
      const id = await currentOrganizationId();
      const value = await request<BackendCampaign>('POST', `/organizations/${id}/campaigns`, {
        title: input.title, description: describeCampaign(input), guidelines: serializeGuidelines(input.requirements),
        platforms: input.platforms.map((item) => item.toUpperCase()), hashtags: input.requirements.hashtags, mentions: input.requirements.mentions, referenceMaterials: (input.referenceMaterials ?? []).map(({ name, url }) => ({ name, url })), maxRewardPerCreatorAmount: input.perCreatorCap.minorUnits > 0 && input.perCreatorCap.minorUnits < input.budget.minorUnits ? input.perCreatorCap.minorUnits : undefined, contentType: input.contentType.toUpperCase(), categoryId: input.categoryId,
        coverImageUrl: await hostedImageUrl(input.coverImageUrl), visibility: input.visibility === 'private' ? 'PRIVATE' : 'PUBLIC', startDate: input.startDate ?? new Date().toISOString(), endDate: input.endDate, goals: input.goals?.trim() || undefined, audience: input.audience?.trim() || undefined,
        currencyCode: input.budget.currency, budgetAmount: input.budget.minorUnits, rewardType: input.rewardType === 'per_item' ? 'FIXED_PER_ITEM' : 'PER_VIEW', rewardAmount: input.ratePerThousandViews.minorUnits,
      });
      return mapCampaign(value, organizationName);
    },
    async getCampaignFunding(campaignId) {
      const value = await request<BackendFunding | null>('GET', `/campaigns/${campaignId}/funding`);
      return value ? mapFunding(value) : null;
    },
    async fundCampaign({ campaignId, amount, client }) {
      return mapFunding(await request<BackendFunding>('POST', `/campaigns/${campaignId}/funding`, { amountMinor: amount.minorUnits, client }));
    },
    async setCampaignStatus({ campaignId, status }) {
      if (status === 'draft') throw new Error('Published campaigns cannot be returned to draft.');
      return mapCampaign(await request<BackendCampaign>('POST', `/campaigns/${campaignId}/${status === 'live' ? 'publish' : 'close'}`), organizationName);
    },
    async getDiscoverCampaigns() { return (await request<BackendCampaign[]>('GET', '/campaigns/discover')).map((item) => mapCampaign(item, item.organization?.name ?? 'Brand')); },
    async getCampaignSubmissions(campaignId) {
      const [submissions, earnings] = await Promise.all([
        request<BackendSubmission[]>('GET', `/campaigns/${campaignId}/submissions`),
        request<BackendCampaignEarnings>('GET', `/campaigns/${campaignId}/earnings`),
      ]);
      return submissions.map((submission) => withEarnings(mapSubmission(submission), submission.creatorUserId, earnings));
    },
    async deleteAccount() { await request<void>('DELETE', '/me/account', { confirmation: 'DELETE' }); },
    async recordSubmissionViews({ submissionId, views }) {
      return toTrackingOutcome(await request<BackendTrackingResult>('POST', `/submissions/${submissionId}/views`, { views }));
    },
    async syncSubmissionViews(submissionId) {
      return toTrackingOutcome(await request<BackendTrackingResult>('POST', `/submissions/${submissionId}/views/sync`));
    },
    async reviewSubmission({ submissionId, decision, reason }) { return mapSubmission(await request<BackendSubmission>('POST', `/submissions/${submissionId}/review`, { decision: REVIEW_DECISION[decision], note: reason })); },
    async getMySubmissions() {
      const [submissions, earnings] = await Promise.all([
        request<BackendSubmission[]>('GET', '/me/submissions'),
        request<BackendCreatorCampaignEarnings[]>('GET', '/me/campaign-earnings'),
      ]);
      return submissions.map((submission) => withCreatorEarnings(mapSubmission(submission), earnings));
    },
    async submitParticipation({ campaignId, postUrl, kind }) { return { ...mapSubmission(await request<BackendSubmission>('POST', `/campaigns/${campaignId}/submissions`, { contentType: kind.toUpperCase(), contentUrl: postUrl })), campaignTitle: 'Campaign', brandName: 'Brand', cap: ZERO_USD, capReached: false }; },
    async resubmitSubmission({ submissionId, postUrl, kind }) { return { ...mapSubmission(await request<BackendSubmission>('POST', `/submissions/${submissionId}/revisions`, { contentType: kind.toUpperCase(), contentUrl: postUrl })), campaignTitle: 'Campaign', brandName: 'Brand', cap: ZERO_USD, capReached: false }; },
    async startVideoUpload({ contentType, size }) { return request<VideoUploadTicket>('POST', '/media/uploads/videos', { contentType, size }); },
    async completeVideoUpload(uploadId) { return request<UploadedVideo>('POST', `/media/uploads/videos/${uploadId}/complete`); },
    async updateCampaign({ campaignId, title, brief, goals, audience, contentRules, hashtags, mentions, endDate }) {
      const value = await request<BackendCampaign>('PATCH', `/campaigns/${campaignId}`, {
        title: title?.trim(), description: brief?.trim(), goals: goals?.trim(), audience: audience?.trim(),
        guidelines: contentRules ? serializeGuidelines({ contentRules, hashtags: [], mentions: [], disclosureRequired: true }) : undefined,
        hashtags, mentions, endDate,
      });
      return mapCampaign(value, value.organization?.name ?? 'Brand');
    },
    async getCampaignReportCsv(campaignId) {
      const current = await token();
      const response = await fetch(`${root}/campaigns/${campaignId}/report/csv`, {
        headers: current ? { Authorization: `Bearer ${current}` } : {},
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Could not export the report (status ${response.status}).`);
      return response.text();
    },
    async inviteTeamMember({ email, role }) {
      await request('POST', `/organizations/${await currentOrganizationId()}/members`, { email: email.trim(), role: role === 'Owner' ? 'OWNER' : 'MEMBER' });
    },
    async updateTeamMemberRole({ memberId, role }) {
      await request('PATCH', `/organizations/${await currentOrganizationId()}/members/${memberId}`, { role: role === 'Owner' ? 'OWNER' : 'MEMBER' });
    },
    async removeTeamMember(memberId) {
      await request('DELETE', `/organizations/${await currentOrganizationId()}/members/${memberId}`);
    },
    async getMyApplications() { return (await request<BackendApplication[]>('GET', '/me/applications')).map(mapMyApplication); },
    async applyToCampaign({ campaignId, message }) { return mapMyApplication(await request<BackendApplication>('POST', `/campaigns/${campaignId}/applications`, { acceptedTerms: true, message: message?.trim() || undefined })); },
    async withdrawApplication(applicationId) { await request('POST', `/applications/${applicationId}/withdraw`); },
    async getCampaignApplications(campaignId) { return (await request<BackendApplication[]>('GET', `/campaigns/${campaignId}/applications`)).map(mapCampaignApplication); },
    async reviewApplication({ applicationId, approve }) { await request('POST', `/applications/${applicationId}/${approve ? 'approve' : 'decline'}`); },
    async getMyInvitations() { return (await request<BackendCreatorInvitation[]>('GET', '/me/invitations')).map(mapCreatorInvitation); },
    async declineInvitation(invitationId) { await request('POST', `/me/invitations/${invitationId}/decline`); },
    async getBrandProfile() {
      const id = await currentOrganizationId();
      const [organization, team] = await Promise.all([
        request<BackendOrganization>('GET', `/organizations/${id}`),
        request<BackendMember[]>('GET', `/organizations/${id}/members`),
      ]);
      return { organizationName: organization.name, website: organization.website ?? undefined, industry: organization.industry ?? undefined, logoUrl: organization.logoUrl ?? undefined, plan: 'Growth', teamMembers: team.map(mapMember) };
    },
    async updateBrandProfile(input) {
      const id = await currentOrganizationId();
      const organization = await request<BackendOrganization>('PATCH', `/organizations/${id}`, { ...input, logoUrl: await hostedImageUrl(input.logoUrl) });
      organizationName = organization.name;
      return { organizationName: organization.name, website: organization.website ?? undefined, industry: organization.industry ?? undefined, logoUrl: organization.logoUrl ?? undefined, plan: 'Growth', teamMembers: [] };
    },
    getCreatorProfile: readCreatorProfile,
    async updateProfile(input) { await request('PATCH', '/creator-profile', { displayName: input.displayName, username: input.username, bio: input.bio, avatarUrl: await hostedImageUrl(input.avatarUrl) }); return readCreatorProfile(); },
    async startVerification() { await request('POST', '/creator-profile/verification'); return readCreatorProfile(); },
    async startPlatformConnection({ platform, client }) {
      return request<{ authorizationUrl: string }>('POST', `/me/social-connections/${platform}/start`, { client });
    },
    async completePlatformConnection({ code, state }) {
      await request('POST', '/me/social-connections/complete', { code, state });
      return await readCreatorProfile();
    },
    async connectSocial(platform) { await request('POST', '/creator-profile/social-accounts', { platform: platform.toUpperCase(), handle: platform }); return await readCreatorProfile(); },
    async getCreatorDirectory(filter) {
      const query = new URLSearchParams();
      if (filter?.platform) query.set('platform', filter.platform.toUpperCase());
      if (filter?.verifiedOnly) query.set('verifiedOnly', 'true');
      const path = query.size ? `/creators?${query}` : '/creators';
      return (await request<(BackendProfile & { userId: string; socialAccounts?: BackendSocialAccount[] })[]>('GET', path)).map((creator) => ({ id: creator.userId, handle: creator.username ? `@${creator.username}` : creator.headline ?? creator.displayName, displayName: creator.displayName, avatarUrl: creator.avatarUrl ?? undefined, platforms: (creator.socialAccounts ?? []).map((account) => platform(account.platform)), categories: [], followers: 0, averageViews: 0, verified: creator.verificationStatus === 'VERIFIED' })); },
    async inviteCreator({ campaignId, creatorId, email }) {
      await request('POST', `/campaigns/${campaignId}/invitations`, creatorId ? { creatorUserId: creatorId } : { creatorEmail: email });
    },
    async getCampaignInvitations(campaignId) {
      return (await request<BackendInvitation[]>('GET', `/campaigns/${campaignId}/invitations`)).map(mapInvitation);
    },
    async revokeInvitation({ campaignId, invitationId }) {
      await request('DELETE', `/campaigns/${campaignId}/invitations/${invitationId}`);
    },
    async getNotifications() { return (await request<{ id: string; type: string; title: string; body: string; createdAt: string; readAt?: string | null }[]>('GET', '/me/notifications')).map((item) => ({ id: item.id, type: notificationType(item.type), title: item.title, body: item.body, date: item.createdAt, read: Boolean(item.readAt) })); },
    async markNotificationsRead() { await request('POST', '/me/notifications/read-all'); return this.getNotifications(); },
    async getNotificationPreferences() {
      return pickNotificationPreferences(await request<NotificationPreferences>('GET', '/me/notification-preferences'));
    },
    async updateNotificationPreferences(prefs) {
      const saved = await request<NotificationPreferences>('PATCH', '/me/notification-preferences', pickNotificationPreferences(prefs));
      return pickNotificationPreferences(saved);
    },
    async getWallet() { return request('GET', '/me/wallet'); },
    async getLedger() { return request('GET', '/me/ledger'); },
    async connectPayout() { return request('POST', '/me/payout/connect'); },
    async requestWithdrawal({ amount }) { await request('POST', '/me/withdrawals', { amountMinor: amount.minorUnits, currencyCode: amount.currency }); return this.getWallet(); },
    async getBrandLedger() { const id = await currentOrganizationId(); return request('GET', `/organizations/${id}/ledger`); },
    async getBrandBilling() { const id = await currentOrganizationId(); return request('GET', `/organizations/${id}/billing`); },
    async setBillingPlan(plan) { const id = await currentOrganizationId(); return request('POST', `/organizations/${id}/subscription/checkout`, { planKey: plan.toLowerCase() }); },
    async setBrandPaymentMethod() { const id = await currentOrganizationId(); return request('POST', `/organizations/${id}/payment-methods`); },
    async getDisputes() { return (await request<BackendDispute[]>('GET', '/disputes')).map(mapDispute); },
    async escalateDispute(disputeId) { return mapDispute(await request<BackendDispute>('POST', `/disputes/${disputeId}/escalate`)); },
    async getDispute(disputeId) { return mapDispute(await request<BackendDispute>('GET', `/disputes/${disputeId}`)); },
    async openDispute(input) {
      return mapDispute(await request<BackendDispute>('POST', '/disputes', { subjectType: input.subjectType.toUpperCase(), subjectId: input.subjectId, reason: input.reason }));
    },
    async sendDisputeMessage({ disputeId, message }) {
      return mapDispute(await request<BackendDispute>('POST', `/disputes/${disputeId}/messages`, { message }));
    },
    async getCampaignFraudCases(campaignId) {
      return (await request<BackendFraudCase[]>('GET', `/campaigns/${campaignId}/fraud-cases`)).map(mapFraudCase);
    },
    async getMyFraudCases() { return (await request<BackendFraudCase[]>('GET', '/me/fraud-cases')).map(mapFraudCase); },
    async flagCreator({ campaignId, creatorId, level, note }) {
      return mapFraudCase(await request<BackendFraudCase>('POST', `/campaigns/${campaignId}/fraud-cases`, { creatorUserId: creatorId, level: level.toUpperCase(), note }));
    },
    async closeFraudCase({ caseId, action }) {
      return mapFraudCase(await request<BackendFraudCase>('POST', `/fraud-cases/${caseId}/${action === 'confirm' ? 'resolve' : 'dismiss'}`));
    },
    async getCampaignReport(campaignId) { return mapReport(await request<BackendReport>('GET', `/campaigns/${campaignId}/report`)); },
    async getAdminOverview() { return request<AdminOverview>('GET', '/admin/overview'); },
    async getAdminUsers(query) {
      const params = new URLSearchParams();
      if (query.search) params.set('search', query.search);
      if (query.type) params.set('type', query.type);
      if (query.status) params.set('status', query.status);
      if (query.page) params.set('page', String(query.page));
      return request<AdminPage<AdminUser>>('GET', `/admin/users?${params.toString()}`);
    },
    async getAdminUserDetail(userId) { return request<AdminUserDetail>('GET', `/admin/users/${userId}`); },
    async getAdminVerifications(page = 1) { return request<AdminPage<AdminVerification>>('GET', `/admin/verifications?page=${page}`); },
    async reviewAdminVerification({ userId, approve, note }) {
      await request('POST', `/admin/verifications/${userId}/${approve ? 'approve' : 'reject'}`, approve ? undefined : { note });
    },
    async getAdminStaff() { return request<AdminStaff[]>('GET', '/admin/staff'); },
    async addAdminStaff(email) { await request('POST', '/admin/staff', { email }); },
    async setAdminStaffActive({ staffId, active }) {
      await request('POST', `/admin/staff/${staffId}/${active ? 'reactivate' : 'deactivate'}`);
    },
    async getAdminBilling() { return request<AdminBilling>('GET', '/admin/billing'); },
    async refundAdminCampaign(campaignId) { return request<AdminRefundOutcome>('POST', `/admin/campaigns/${campaignId}/refund`); },
    async setAdminUserSuspended({ userId, suspended }) {
      await request('POST', `/admin/users/${userId}/${suspended ? 'suspend' : 'reactivate'}`);
    },
    async getAdminOrganizations(page = 1) { return request<AdminPage<AdminOrganization>>('GET', `/admin/organizations?page=${page}`); },
    async getAdminCampaigns(query) {
      const params = new URLSearchParams();
      if (query.status) params.set('status', query.status);
      if (query.search) params.set('search', query.search);
      if (query.page) params.set('page', String(query.page));
      return request<AdminPage<AdminCampaign>>('GET', `/admin/campaigns?${params.toString()}`);
    },
    async closeAdminCampaign(campaignId) { await request('POST', `/admin/campaigns/${campaignId}/close`); },
    async getAdminFundings(page = 1) { return request<AdminPage<AdminFunding>>('GET', `/admin/fundings?page=${page}`); },
    async getAdminWithdrawals(scope, page = 1) { return request<AdminPage<AdminWithdrawal>>('GET', `/admin/withdrawals?scope=${scope}&page=${page}`); },
    async decideAdminWithdrawal({ withdrawalId, action, reason }) {
      await request('POST', `/admin/withdrawals/${withdrawalId}/${action}`, action === 'hold' ? { reason } : undefined);
    },
    async getAdminCategories() { return request<AdminCategory[]>('GET', '/admin/categories'); },
    async createAdminCategory(name) { await request('POST', '/admin/campaign-categories', { name }); },
    async getAdminAuditLog(page = 1) { return request<AdminPage<AdminAuditEntry>>('GET', `/admin/audit-log?page=${page}`); },
    async getAdminDisputes(scope) { return (await request<BackendDispute[]>('GET', `/admin/disputes?scope=${scope}`)).map(mapDispute); },
    async reviewDispute(disputeId) { return mapDispute(await request<BackendDispute>('POST', `/admin/disputes/${disputeId}/review`)); },
    async decideDispute({ disputeId, outcome, note }) {
      return mapDispute(await request<BackendDispute>('POST', `/admin/disputes/${disputeId}/decision`, { outcome: outcome.toUpperCase(), note }));
    },
    async getAdminFraudCases(status) {
      const query = status ? `?status=${{ open: 'OPEN', confirmed: 'RESOLVED', cleared: 'DISMISSED' }[status]}` : '';
      return (await request<BackendFraudCase[]>('GET', `/admin/fraud-cases${query}`)).map(mapFraudCase);
    },
    async adminCloseFraudCase({ caseId, action }) {
      return mapFraudCase(await request<BackendFraudCase>('POST', `/admin/fraud-cases/${caseId}/${action}`));
    },
    async generateBrief(input) { return request('POST', '/ai/campaign-brief', { idea: `${input.product}: ${input.goal} for ${input.platform}` }); },
    async generateContentIdeas(input) { return request('POST', '/ai/content-ideas', { topic: input.campaignId }); },
  };
}

export async function clearBackendSession(channel: SessionChannel = APP_SESSION_CHANNEL) {
  // Session state is also reset by the client request path on next sign-in.
  await fetch(`${channel.routes}/session`, { method: 'DELETE' });
}

async function apiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { message?: string | string[]; code?: string };
    const message = Array.isArray(body.message) ? body.message[0] ?? 'The request failed.' : body.message ?? 'The request failed.';
    return new ApiError(message, body.code);
  } catch { return new ApiError(`The request failed (${response.status}).`); }
}

/** No role means "sign in only": the backend then refuses to create an account. */
function userTypeOf(role?: Role) {
  return role ? (role === 'brand' ? 'BRAND_USER' : 'CREATOR') : undefined;
}

function mapSession(account: BackendAccount): Session {
  return {
    userId: account.id,
    role: account.type === 'BRAND_USER' ? 'brand' : 'creator',
    displayName: account.organizations?.[0]?.name ?? account.email?.split('@')[0] ?? account.phone ?? 'Zeyoo user',
    email: account.email ?? '',
    emailVerified: account.emailVerifiedAt != null || account.phoneVerifiedAt != null,
    hasOrganization: account.type !== 'BRAND_USER' || Boolean(account.organizations?.length),
    hasCreatorProfile: account.type !== 'CREATOR' || Boolean(account.hasCreatorProfile),
  };
}

function mapCampaign(value: BackendCampaign, brandName: string): Campaign {
  const currency = value.currencyCode || 'USD';
  return { id: value.id, title: value.title, brandName, platform: platform(value.platform), platforms: (value.platforms?.length ? value.platforms : [value.platform]).map(platform), contentType: value.contentType === 'CLIPPING' ? 'clipping' : 'ugc', endDate: value.endDate, coverImageUrl: value.coverImageUrl ?? undefined, rewardType: value.rewardType === 'FIXED_PER_ITEM' ? 'per_item' : 'per_view', ratePerThousandViews: { minorUnits: value.rewardAmount, currency }, goals: value.goals ?? undefined, audience: value.audience ?? undefined, startDate: value.startDate, budget: { minorUnits: value.budgetAmount, currency }, budgetSpent: { minorUnits: 0, currency }, perCreatorCap: { minorUnits: value.maxRewardPerCreatorAmount ?? value.budgetAmount, currency }, status: value.status === 'PUBLISHED' ? 'live' : value.status === 'CLOSED' ? 'closed' : 'draft', brief: value.description, requirements: { hashtags: value.hashtags ?? [], mentions: value.mentions ?? [], contentRules: parseGuidelines(value.guidelines), disclosureRequired: true }, submissionCount: 0, referenceMaterials: (value.referenceMaterials ?? []).map((material, index) => ({ id: `${value.id}-${index}`, name: material.name, url: material.url })) };
}

interface BackendCampaignEarnings { currencyCode: string; creators: { creatorUserId: string; views: number; accruedMinor: number; paused: boolean; risk: string }[] }
interface BackendTrackingResult { results: { outcome: { status: 'RECORDED' | 'UNAVAILABLE'; views?: number; message?: string } }[] }

function withCreatorEarnings(submission: Submission, earnings: BackendCreatorCampaignEarnings[]): CreatorSubmission {
  const entry = earnings.find((item) => item.campaignId === submission.campaignId);
  const currency = entry?.currencyCode ?? 'USD';
  const accrued = entry?.accruedMinor ?? 0;
  const cap = entry?.capMinor ?? null;
  return {
    ...submission,
    views: entry?.views ?? 0,
    earning: { minorUnits: accrued, currency },
    campaignTitle: entry?.campaignTitle ?? 'Campaign',
    brandName: 'Brand',
    cap: { minorUnits: cap ?? 0, currency },
    capReached: cap !== null && accrued >= cap,
    earningsPaused: entry?.paused ?? false,
  };
}

function withEarnings(submission: Submission, creatorUserId: string, earnings: BackendCampaignEarnings): Submission {
  const entry = earnings.creators.find((creator) => creator.creatorUserId === creatorUserId);
  if (!entry) return submission;
  return { ...submission, views: entry.views, earning: { minorUnits: entry.accruedMinor, currency: earnings.currencyCode }, earningsPaused: entry.paused, risk: entry.risk.toLowerCase() as Submission['risk'] };
}

function toTrackingOutcome(result: BackendTrackingResult): ViewTrackingOutcome {
  const outcome = result.results[0]?.outcome;
  if (outcome?.status === 'RECORDED') return { status: 'recorded', views: outcome.views };
  return { status: 'unavailable', message: outcome?.message ?? 'Views could not be read.' };
}

function mapSubmission(value: BackendSubmission): Submission {
  const latest = value.revisions?.at(-1);
  const creator = value.creator;
  return { id: value.id, campaignId: value.campaignId, creatorId: value.creatorUserId, creatorHandle: creator ? `@${creator.username}` : 'Creator', creatorName: creator?.displayName, creatorAvatarUrl: creator?.avatarUrl ?? undefined, accountVerified: value.accountVerified, postUrl: latest?.contentUrl ?? '', kind: latest?.contentType === 'UPLOAD' ? 'upload' : 'link', views: 0, earning: ZERO_USD, status: value.status === 'APPROVED' ? 'approved' : value.status === 'REJECTED' ? 'rejected' : value.status === 'NEEDS_CHANGES' ? 'needs_changes' : 'pending', ...reviewNotes(value) };
}

/** The brand's note on the latest review, shown to the creator as the reason or the change request. */
function reviewNotes(value: BackendSubmission): Pick<Submission, 'rejectionReason' | 'changeRequest'> {
  const note = value.reviews?.at(-1)?.note ?? undefined;
  if (value.status === 'REJECTED') return { rejectionReason: note };
  if (value.status === 'NEEDS_CHANGES') return { changeRequest: note };
  return {};
}

function mapCreatorProfile(value: BackendProfile, accounts: BackendSocialAccount[] = []): CreatorProfile {
  return { username: value.username ?? '', handle: value.username ? `@${value.username}` : value.headline ?? value.displayName, avatarUrl: value.avatarUrl ?? undefined, displayName: value.displayName, bio: value.bio ?? '', categories: [], verification: value.verificationStatus === 'VERIFIED' ? 'verified' : value.verificationStatus === 'PENDING' ? 'pending' : value.verificationStatus === 'REJECTED' ? 'rejected' : 'unverified', verificationNote: value.verificationNote ?? undefined, socialAccounts: accounts.map(mapSocialAccount), payoutConnected: false };
}

function pickNotificationPreferences(value: NotificationPreferences): NotificationPreferences {
  return {
    pushEnabled: value.pushEnabled,
    emailEnabled: value.emailEnabled,
    submissionUpdates: value.submissionUpdates,
    payoutUpdates: value.payoutUpdates,
    campaignInvites: value.campaignInvites,
    productNews: value.productNews,
  };
}

interface BackendDispute {
  id: string; subjectType: string; subjectId: string | null; subjectTitle: string; reason: string;
  status: string; createdAt: string; openedByName: string;
  responseDueAt: string; escalatedAt: string | null; overdue: boolean; canEscalate: boolean;
  events: { id: string; message: string; createdAt: string; author: 'YOU' | 'SUPPORT' | 'OTHER' }[];
}
interface BackendApplication {
  id: string; campaignId: string; creatorUserId: string; status: string; source: string;
  message: string | null; createdAt: string;
  campaign?: { title: string };
  creator?: { displayName: string; username: string; avatarUrl: string | null } | null;
}
interface BackendCreatorInvitation {
  id: string; campaignId: string; createdAt: string;
  campaign: { title: string; platform: string };
}
interface BackendFraudCase {
  id: string; campaignId: string; campaignTitle: string; creatorUserId: string; creatorName: string;
  level: string; status: string; note: string | null; createdAt: string;
}
interface BackendReport {
  campaignId: string; title: string; currencyCode: string; budgetMinor: number; fundedMinor: number;
  spentMinor: number; totalViews: number; costPerThousandViewsMinor: number | null;
  applications: { total: number; approved: number }; submissions: { total: number; approved: number };
  topCreators: { creatorUserId: string; name: string; views: number; accruedMinor: number; paused: boolean }[];
}

const REVIEW_DECISION = { approve: 'APPROVED', reject: 'REJECTED', request_changes: 'CHANGES_REQUESTED' } as const;

const DISPUTE_STATUS: Record<string, Dispute['status']> = {
  OPEN: 'open',
  UNDER_REVIEW: 'in_review',
  RESOLVED: 'upheld',
  REJECTED: 'denied',
};
const FRAUD_STATUS: Record<string, FraudCase['status']> = {
  OPEN: 'open',
  RESOLVED: 'confirmed',
  DISMISSED: 'cleared',
};

function mapDispute(value: BackendDispute): Dispute {
  return {
    id: value.id,
    subjectType: value.subjectType.toLowerCase() as Dispute['subjectType'],
    subjectId: value.subjectId ?? undefined,
    title: value.subjectTitle,
    status: DISPUTE_STATUS[value.status] ?? 'open',
    reason: value.reason,
    createdAt: value.createdAt,
    openedByName: value.openedByName,
    responseDueAt: value.responseDueAt,
    escalatedAt: value.escalatedAt ?? undefined,
    overdue: value.overdue,
    canEscalate: value.canEscalate,
    events: value.events.map((event) => ({
      id: event.id,
      author: event.author.toLowerCase() as DisputeEvent['author'],
      message: event.message,
      date: event.createdAt,
    })),
  };
}

function mapFraudCase(value: BackendFraudCase): FraudCase {
  return {
    id: value.id,
    campaignId: value.campaignId,
    campaignTitle: value.campaignTitle,
    creatorId: value.creatorUserId,
    creatorName: value.creatorName,
    level: value.level.toLowerCase() as FraudCase['level'],
    status: FRAUD_STATUS[value.status] ?? 'open',
    note: value.note ?? undefined,
    createdAt: value.createdAt,
  };
}

function mapReport(value: BackendReport): CampaignReport {
  const money = (minorUnits: number): Money => ({ minorUnits, currency: value.currencyCode });
  return {
    campaignId: value.campaignId,
    title: value.title,
    currency: value.currencyCode,
    budget: money(value.budgetMinor),
    funded: money(value.fundedMinor),
    spent: money(value.spentMinor),
    totalViews: value.totalViews,
    costPerThousandViews:
      value.costPerThousandViewsMinor === null ? undefined : money(value.costPerThousandViewsMinor),
    applications: value.applications,
    submissions: value.submissions,
    topCreators: value.topCreators.map((creator) => ({
      creatorId: creator.creatorUserId,
      name: creator.name,
      views: creator.views,
      earned: money(creator.accruedMinor),
      paused: creator.paused,
    })),
  };
}

function mapFunding(value: BackendFunding): CampaignFunding {
  return {
    fundingId: value.fundingId,
    status: value.status === 'SUCCEEDED' ? 'succeeded' : value.status === 'FAILED' ? 'failed' : 'pending',
    amount: { minorUnits: value.amountMinor, currency: value.currencyCode },
    checkoutUrl: value.checkoutUrl ?? undefined,
  };
}

interface BackendMember { id: string; userId: string; role: string; user?: { email: string | null } | null }

function mapMember(member: BackendMember): TeamMember {
  const email = member.user?.email ?? '';
  return { id: member.id, userId: member.userId, name: email ? email.split('@')[0] ?? email : 'Teammate', email, role: member.role === 'OWNER' ? 'Owner' : 'Member' };
}

function mapMyApplication(value: BackendApplication): MyApplication {
  return {
    id: value.id,
    campaignId: value.campaignId,
    campaignTitle: value.campaign?.title ?? 'Campaign',
    status: value.status.toLowerCase() as MyApplication['status'],
    fromInvitation: value.source === 'INVITATION',
    message: value.message ?? undefined,
    createdAt: value.createdAt,
  };
}

function mapCampaignApplication(value: BackendApplication): CampaignApplication {
  return {
    id: value.id,
    creatorId: value.creatorUserId,
    creatorName: value.creator?.displayName ?? 'Creator',
    creatorHandle: value.creator ? `@${value.creator.username}` : '',
    creatorAvatarUrl: value.creator?.avatarUrl ?? undefined,
    status: value.status.toLowerCase() as CampaignApplication['status'],
    fromInvitation: value.source === 'INVITATION',
    message: value.message ?? undefined,
    createdAt: value.createdAt,
  };
}

function mapCreatorInvitation(value: BackendCreatorInvitation): CreatorInvitation {
  return {
    id: value.id,
    campaignId: value.campaignId,
    campaignTitle: value.campaign.title,
    platform: value.campaign.platform.toLowerCase() as CreatorInvitation['platform'],
    createdAt: value.createdAt,
  };
}

function mapInvitation(value: BackendInvitation): CampaignInvitation {
  return {
    id: value.id,
    campaignId: value.campaignId,
    creatorId: value.creatorUserId,
    name: value.creator?.displayName ?? 'Creator',
    handle: value.creator ? `@${value.creator.username}` : '',
    avatarUrl: value.creator?.avatarUrl ?? undefined,
    status: value.status.toLowerCase() as CampaignInvitation['status'],
  };
}

function mapSocialAccount(account: BackendSocialAccount): SocialAccount {
  return { platform: platform(account.platform), handle: account.handle, connected: account.status === 'CONNECTED', verified: Boolean(account.verifiedAt), followers: 0 };
}

function platform(value: string): Campaign['platform'] { return value === 'INSTAGRAM' ? 'instagram' : value === 'SNAPCHAT' ? 'snapchat' : value === 'YOUTUBE' ? 'youtube' : 'tiktok'; }
function describeCampaign(input: { brief: string; title: string }) { return input.brief || input.title; }
function serializeGuidelines(requirements: CampaignRequirements) { return requirements.contentRules.join('\n'); }
function parseGuidelines(value?: string | null) { return value?.split('\n').map((item) => item.trim()).filter(Boolean) ?? []; }
function notificationType(value: string): 'campaign' | 'submission' | 'payout' | 'system' { return value.includes('SUBMISSION') ? 'submission' : value.includes('PAYOUT') ? 'payout' : value.includes('CAMPAIGN') ? 'campaign' : 'system'; }
