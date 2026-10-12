'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type { ReviewSubmissionInput, SubmitParticipationInput } from '@/shared/api';

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

/** Record or sync a submission's views, then refresh the list so earnings show. */
export function useTrackViews(campaignId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { submissionId: string; views?: number }) =>
      input.views === undefined
        ? api.syncSubmissionViews(input.submissionId)
        : api.recordSubmissionViews({ submissionId: input.submissionId, views: input.views }),
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

