'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type { OpenDisputeInput, ReviewSubmissionInput, SubmitParticipationInput } from '@/shared/api';

export function useCampaignSubmissions(campaignId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.campaignSubmissions(campaignId),
    queryFn: () => api.getCampaignSubmissions(campaignId),
  });
}

export function useReviewSubmission(campaignId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewSubmissionInput) => api.reviewSubmission(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignSubmissions(campaignId) });
    },
  });
}

export function useMySubmissions() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.mySubmissions, queryFn: () => api.getMySubmissions() });
}

export function useSubmitParticipation() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitParticipationInput) => api.submitParticipation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mySubmissions });
    },
  });
}

export function useOpenDispute() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OpenDisputeInput) => api.openDispute(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes });
    },
  });
}
