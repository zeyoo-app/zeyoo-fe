'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type {
  Campaign,
  CampaignStatus,
  CreateCampaignInput,
  CreatorDirectoryFilter,
  UpdateCampaignInput,
  FlagCreatorInput,
  InviteCreatorInput,
} from '@/shared/api';

export function useBrandDashboard() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.brandDashboard, queryFn: () => api.getBrandDashboard() });
}

export function useBrandCampaigns() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.brandCampaigns, queryFn: () => api.getBrandCampaigns() });
}

export function useDiscoverCampaigns() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.discoverCampaigns, queryFn: () => api.getDiscoverCampaigns() });
}

export function useCampaign(campaignId: string) {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.campaign(campaignId), queryFn: () => api.getCampaign(campaignId) });
}

export function useCampaignCategories() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.campaignCategories,
    queryFn: () => api.getCampaignCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCampaign() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => api.createCampaign(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brandCampaigns });
      queryClient.invalidateQueries({ queryKey: queryKeys.brandDashboard });
    },
  });
}

/** Polls the latest funding attempt while a payment is being made on Stripe's page. */
export function useCampaignFunding(campaignId: string, waiting: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: ['campaigns', campaignId, 'funding'],
    queryFn: () => api.getCampaignFunding(campaignId),
    enabled: waiting,
    refetchInterval: waiting ? 3000 : false,
  });
}

export function useFundCampaign() {
  const api = useApi();
  return useMutation({ mutationFn: api.fundCampaign });
}

export function useSetCampaignStatus(campaignId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: CampaignStatus) => api.setCampaignStatus({ campaignId, status }),
    onSuccess: (updated: Campaign) => {
      queryClient.setQueryData(queryKeys.campaign(campaignId), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.brandCampaigns });
    },
  });
}

export function useCreatorDirectory(filter: CreatorDirectoryFilter = {}) {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.creatorDirectory, filter.platform ?? 'any', Boolean(filter.verifiedOnly)],
    queryFn: () => api.getCreatorDirectory(filter),
  });
}

/** Edit a campaign, then refresh it and the brand's lists. */
export function useUpdateCampaign() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCampaignInput) => api.updateCampaign(input),
    onSuccess: (campaign) => {
      queryClient.setQueryData(queryKeys.campaign(campaign.id), campaign);
      queryClient.invalidateQueries({ queryKey: queryKeys.brandCampaigns });
      queryClient.invalidateQueries({ queryKey: queryKeys.brandDashboard });
    },
  });
}

/** Everyone invited to a campaign so far, with where each invitation stands. */
export function useCampaignInvitations(campaignId: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.campaignInvitations(campaignId ?? ''),
    queryFn: () => api.getCampaignInvitations(campaignId as string),
    enabled: Boolean(campaignId),
  });
}

export function useInviteCreator(campaignId: string | undefined) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Pick<InviteCreatorInput, 'creatorId' | 'email'>) =>
      api.inviteCreator({ campaignId: campaignId as string, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignInvitations(campaignId ?? '') });
    },
  });
}

export function useRevokeInvitation(campaignId: string | undefined) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      api.revokeInvitation({ campaignId: campaignId as string, invitationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignInvitations(campaignId ?? '') });
    },
  });
}

/** Fraud reviews opened on a campaign, newest first. */
export function useCampaignFraudCases(campaignId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.campaignFraudCases(campaignId),
    queryFn: () => api.getCampaignFraudCases(campaignId),
  });
}

function useRefreshAfterFraudChange(campaignId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.campaignFraudCases(campaignId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.campaignSubmissions(campaignId) });
  };
}

export function useFlagCreator(campaignId: string) {
  const api = useApi();
  const refresh = useRefreshAfterFraudChange(campaignId);
  return useMutation({
    mutationFn: (input: Omit<FlagCreatorInput, 'campaignId'>) =>
      api.flagCreator({ campaignId, ...input }),
    onSuccess: refresh,
  });
}

export function useCloseFraudCase(campaignId: string) {
  const api = useApi();
  const refresh = useRefreshAfterFraudChange(campaignId);
  return useMutation({
    mutationFn: (input: { caseId: string; action: 'confirm' | 'clear' }) => api.closeFraudCase(input),
    onSuccess: refresh,
  });
}

export function useCampaignReport(campaignId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.campaignReport(campaignId),
    queryFn: () => api.getCampaignReport(campaignId),
  });
}
