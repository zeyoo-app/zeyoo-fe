/** Central registry of TanStack Query keys, so invalidation stays consistent. */
export const queryKeys = {
  brandDashboard: ['brand', 'dashboard'] as const,
  brandCampaigns: ['brand', 'campaigns'] as const,
  campaign: (campaignId: string) => ['campaigns', campaignId] as const,
  campaignSubmissions: (campaignId: string) => ['campaigns', campaignId, 'submissions'] as const,
  discoverCampaigns: ['discover', 'campaigns'] as const,
  mySubmissions: ['creator', 'submissions'] as const,
  wallet: ['wallet'] as const,
  ledger: ['wallet', 'ledger'] as const,
  brandBilling: ['brand', 'billing'] as const,
  creatorProfile: ['creator', 'profile'] as const,
  brandProfile: ['brand', 'profile'] as const,
  creatorDirectory: ['brand', 'creators'] as const,
  notifications: ['notifications'] as const,
  notificationPreferences: ['notifications', 'preferences'] as const,
  disputes: ['disputes'] as const,
};
