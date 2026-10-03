import type { Money } from '../money/money';
import type { ZeyooApi } from './ZeyooApi';
import type {
  CodeSent,
  Campaign,
  CampaignCategory,
  CampaignFunding,
  CampaignRequirements,
  CreatorProfile,
  Session,
  Submission,
} from './types';

interface BackendTokens { accessToken: string; refreshToken: string }
interface BackendAccount { id: string; email: string | null; phone?: string | null; type: string; emailVerifiedAt?: string | null; phoneVerifiedAt?: string | null; organizations?: { organizationId: string; name: string }[]; hasCreatorProfile?: boolean }
interface BackendOrganization { id: string; name: string; website?: string | null; industry?: string | null; logoUrl?: string | null }
interface BackendCampaign { id: string; title: string; description: string; guidelines?: string | null; platform: string; status: string; currencyCode: string; budgetAmount: number; rewardAmount: number; organization?: { name?: string }; organizationId: string; categoryId?: string | null; endDate?: string; contentType?: string; coverImageUrl?: string | null }
interface BackendFunding { fundingId: string; clientSecret: string; amountMinor: number; currencyCode: string }
interface BackendProfile { displayName: string; username?: string; avatarUrl?: string | null; headline?: string | null; bio?: string | null; verificationStatus?: string }
interface BackendSubmission { id: string; campaignId: string; status: string; creatorUserId: string; revisions?: { contentType: string; contentUrl: string }[] }

const ZERO_USD: Money = { minorUnits: 0, currency: 'USD' };

export function createBackendApi(baseUrl: string): ZeyooApi {
  const root = baseUrl.replace(/\/$/, '');
  let accessToken: string | null = null;
  let refreshRequest: Promise<string | null> | null = null;
  let organizationId: string | null = null;
  let organizationName = 'Your organization';

  async function refreshAccessToken() {
    const response = await fetch('/api/auth/refresh', { method: 'POST', cache: 'no-store' });
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
    if (!response.ok) throw new Error(await apiErrorMessage(response));
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async function establishSession(tokens: BackendTokens): Promise<Session> {
    accessToken = tokens.accessToken;
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
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
    async requestEmailCode({ email }) { return request<CodeSent>('POST', '/auth/email/code', { email }, false); },
    async verifyEmailCode({ email, code, role }) {
      return establishSession(await request<BackendTokens>('POST', '/auth/email/code/verify', {
        email, code, userType: role === 'brand' ? 'BRAND_USER' : 'CREATOR',
      }, false));
    },
    async requestPhoneCode({ phone }) { return request<CodeSent>('POST', '/auth/phone/code', { phone }, false); },
    async verifyPhoneCode({ phone, code, role }) {
      return establishSession(await request<BackendTokens>('POST', '/auth/phone/code/verify', {
        phone, code, userType: role === 'brand' ? 'BRAND_USER' : 'CREATOR',
      }, false));
    },
    async oauthSignIn({ provider, idToken, role }) {
      return establishSession(await request<BackendTokens>('POST', `/auth/oauth/${provider}`, {
        idToken, userType: role === 'brand' ? 'BRAND_USER' : 'CREATOR',
      }, false));
    },
    async setupBrand(input) {
      const organization = await request<BackendOrganization>('POST', '/organizations', input);
      organizationId = organization.id;
      organizationName = organization.name;
      return mapSession(await request<BackendAccount>('GET', '/me'));
    },
    async setupCreator(input) {
      await request('POST', '/creator-profile', { displayName: input.displayName, username: input.username, avatarUrl: input.avatarUrl });
      await Promise.all(input.platforms.map((platform) => request('POST', '/creator-profile/social-accounts', { platform: platform.toUpperCase(), handle: `@${input.username}` })));
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
        platform: input.platform.toUpperCase(), contentType: input.contentType.toUpperCase(), categoryId: input.categoryId,
        coverImageUrl: input.coverImageUrl, visibility: 'PRIVATE', startDate: new Date().toISOString(), endDate: input.endDate,
        currencyCode: input.budget.currency, budgetAmount: input.budget.minorUnits, rewardType: 'PER_VIEW', rewardAmount: input.ratePerThousandViews.minorUnits,
      });
      return mapCampaign(value, organizationName);
    },
    async fundCampaign({ campaignId, amount }) {
      const value = await request<BackendFunding>('POST', `/campaigns/${campaignId}/funding`, { amountMinor: amount.minorUnits });
      return { fundingId: value.fundingId, status: 'pending', amount: { minorUnits: value.amountMinor, currency: value.currencyCode }, clientSecret: value.clientSecret } satisfies CampaignFunding;
    },
    async setCampaignStatus({ campaignId, status }) {
      if (status === 'draft') throw new Error('Published campaigns cannot be returned to draft.');
      return mapCampaign(await request<BackendCampaign>('POST', `/campaigns/${campaignId}/${status === 'live' ? 'publish' : 'close'}`), organizationName);
    },
    async getDiscoverCampaigns() { return (await request<BackendCampaign[]>('GET', '/campaigns/discover')).map((item) => mapCampaign(item, item.organization?.name ?? 'Brand')); },
    async getCampaignSubmissions(campaignId) { return (await request<BackendSubmission[]>('GET', `/campaigns/${campaignId}/submissions`)).map(mapSubmission); },
    async reviewSubmission({ submissionId, decision, reason }) { return mapSubmission(await request<BackendSubmission>('POST', `/submissions/${submissionId}/review`, { decision: decision === 'approve' ? 'APPROVED' : 'REJECTED', note: reason })); },
    async getMySubmissions() { return (await request<BackendSubmission[]>('GET', '/me/submissions')).map((item) => ({ ...mapSubmission(item), campaignTitle: 'Campaign', brandName: 'Brand', cap: ZERO_USD, capReached: false })); },
    async submitParticipation({ campaignId, postUrl, kind }) { return { ...mapSubmission(await request<BackendSubmission>('POST', `/campaigns/${campaignId}/submissions`, { contentType: kind.toUpperCase(), contentUrl: postUrl })), campaignTitle: 'Campaign', brandName: 'Brand', cap: ZERO_USD, capReached: false }; },
    async getBrandProfile() {
      const id = await currentOrganizationId();
      const [organization, team] = await Promise.all([
        request<BackendOrganization>('GET', `/organizations/${id}`),
        request<{ userId: string; name: string; email: string | null; role: string }[]>('GET', `/organizations/${id}/members`),
      ]);
      return { organizationName: organization.name, website: organization.website ?? undefined, industry: organization.industry ?? undefined, logoUrl: organization.logoUrl ?? undefined, plan: 'Growth', teamMembers: team.map((member) => ({ id: member.userId, name: member.name, email: member.email ?? '', role: member.role === 'OWNER' ? 'Owner' : member.role === 'ADMIN' ? 'Admin' : 'Member' })) };
    },
    async updateBrandProfile(input) {
      const id = await currentOrganizationId();
      const organization = await request<BackendOrganization>('PATCH', `/organizations/${id}`, input);
      organizationName = organization.name;
      return { organizationName: organization.name, website: organization.website ?? undefined, industry: organization.industry ?? undefined, logoUrl: organization.logoUrl ?? undefined, plan: 'Growth', teamMembers: [] };
    },
    async getCreatorProfile() { return mapCreatorProfile(await request<BackendProfile>('GET', '/creator-profile')); },
    async updateProfile(input) { return mapCreatorProfile(await request<BackendProfile>('PATCH', '/creator-profile', { displayName: input.displayName, bio: input.bio })); },
    async startVerification() { return mapCreatorProfile(await request<BackendProfile>('POST', '/creator-profile/verification')); },
    async connectSocial(platform) { await request('POST', '/creator-profile/social-accounts', { platform: platform.toUpperCase(), handle: platform }); return mapCreatorProfile(await request<BackendProfile>('GET', '/creator-profile')); },
    async getCreatorDirectory() { return (await request<(BackendProfile & { userId: string })[]>('GET', '/creators')).map((creator) => ({ id: creator.userId, handle: creator.headline ?? creator.displayName, displayName: creator.displayName, platforms: [], categories: [], followers: 0, averageViews: 0 })); },
    async inviteCreator({ creatorId, campaignId }) { await request('POST', `/campaigns/${campaignId}/invitations`, { creatorUserId: creatorId }); },
    async getNotifications() { return (await request<{ id: string; type: string; title: string; body: string; createdAt: string; readAt?: string | null }[]>('GET', '/me/notifications')).map((item) => ({ id: item.id, type: notificationType(item.type), title: item.title, body: item.body, date: item.createdAt, read: Boolean(item.readAt) })); },
    async markNotificationsRead() { await request('POST', '/me/notifications/read-all'); return this.getNotifications(); },
    async getNotificationPreferences() { const value = await request<{ emailEnabled: boolean; pushEnabled: boolean }>('GET', '/me/notification-preferences'); return { submissionUpdates: value.pushEnabled, payoutUpdates: value.pushEnabled, campaignInvites: value.pushEnabled, productNews: value.emailEnabled }; },
    async updateNotificationPreferences(prefs) { await request('PATCH', '/me/notification-preferences', { pushEnabled: prefs.submissionUpdates || prefs.payoutUpdates || prefs.campaignInvites, emailEnabled: prefs.productNews }); return prefs; },
    async getWallet() { return request('GET', '/me/wallet'); },
    async getLedger() { return request('GET', '/me/ledger'); },
    async connectPayout() { return request('POST', '/me/payout/connect'); },
    async requestWithdrawal({ amount }) { await request('POST', '/me/withdrawals', { amountMinor: amount.minorUnits, currencyCode: amount.currency }); return this.getWallet(); },
    async getBrandLedger() { const id = await currentOrganizationId(); return request('GET', `/organizations/${id}/ledger`); },
    async getBrandBilling() { const id = await currentOrganizationId(); return request('GET', `/organizations/${id}/billing`); },
    async setBillingPlan(plan) { const id = await currentOrganizationId(); return request('POST', `/organizations/${id}/subscription/checkout`, { planKey: plan.toLowerCase() }); },
    async setBrandPaymentMethod() { const id = await currentOrganizationId(); return request('POST', `/organizations/${id}/payment-methods`); },
    async getDisputes() { return request('GET', '/disputes'); },
    async openDispute(input) { return request('POST', '/disputes', { subjectType: 'SUBMISSION', subjectId: input.submissionId, reason: input.reason }); },
    async generateBrief(input) { return request('POST', '/ai/campaign-brief', { idea: `${input.product}: ${input.goal} for ${input.platform}` }); },
    async generateContentIdeas(input) { return request('POST', '/ai/content-ideas', { topic: input.campaignId }); },
  };
}

export async function clearBackendSession() {
  await fetch('/api/auth/session', { method: 'DELETE' });
}

async function apiErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message) ? body.message[0] ?? 'The request failed.' : body.message ?? 'The request failed.';
  } catch { return `The request failed (${response.status}).`; }
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
  return { id: value.id, title: value.title, brandName, platform: platform(value.platform), contentType: value.contentType === 'CLIPPING' ? 'clipping' : 'ugc', endDate: value.endDate, coverImageUrl: value.coverImageUrl ?? undefined, ratePerThousandViews: { minorUnits: value.rewardAmount, currency }, budget: { minorUnits: value.budgetAmount, currency }, budgetSpent: { minorUnits: 0, currency }, perCreatorCap: { minorUnits: value.budgetAmount, currency }, status: value.status === 'PUBLISHED' ? 'live' : value.status === 'CLOSED' ? 'closed' : 'draft', brief: value.description, requirements: { hashtags: [], mentions: [], contentRules: parseGuidelines(value.guidelines), disclosureRequired: true }, submissionCount: 0, referenceMaterials: [] };
}

function mapSubmission(value: BackendSubmission): Submission {
  const latest = value.revisions?.at(-1);
  return { id: value.id, campaignId: value.campaignId, creatorHandle: value.creatorUserId, postUrl: latest?.contentUrl ?? '', kind: latest?.contentType === 'UPLOAD' ? 'upload' : 'link', views: 0, earning: ZERO_USD, status: value.status === 'APPROVED' ? 'approved' : value.status === 'REJECTED' ? 'rejected' : 'pending' };
}

function mapCreatorProfile(value: BackendProfile): CreatorProfile {
  return { handle: value.username ? `@${value.username}` : value.headline ?? value.displayName, avatarUrl: value.avatarUrl ?? undefined, displayName: value.displayName, bio: value.bio ?? '', categories: [], verification: value.verificationStatus === 'VERIFIED' ? 'verified' : value.verificationStatus === 'PENDING' ? 'pending' : 'unverified', socialAccounts: [], payoutConnected: false };
}

function platform(value: string): Campaign['platform'] { return value === 'INSTAGRAM' ? 'instagram' : value === 'SNAPCHAT' ? 'snapchat' : value === 'YOUTUBE' ? 'youtube' : 'tiktok'; }
function describeCampaign(input: { brief: string; title: string }) { return input.brief || input.title; }
function serializeGuidelines(requirements: CampaignRequirements) { return [...requirements.contentRules, ...requirements.hashtags, ...requirements.mentions].join('\n'); }
function parseGuidelines(value?: string | null) { return value?.split('\n').map((item) => item.trim()).filter(Boolean) ?? []; }
function notificationType(value: string): 'campaign' | 'submission' | 'payout' | 'system' { return value.includes('SUBMISSION') ? 'submission' : value.includes('PAYOUT') ? 'payout' : value.includes('CAMPAIGN') ? 'campaign' : 'system'; }
