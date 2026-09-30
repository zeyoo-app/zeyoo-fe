'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type { Campaign, CampaignStatus, CreateCampaignInput, InviteCreatorInput } from '@/shared/api';

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

export function useCreatorDirectory() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.creatorDirectory, queryFn: () => api.getCreatorDirectory() });
}

export function useInviteCreator() {
  const api = useApi();
  return useMutation({ mutationFn: (input: InviteCreatorInput) => api.inviteCreator(input) });
}
