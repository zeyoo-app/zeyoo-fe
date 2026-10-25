'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type {
  ApplyToCampaignInput,
  ResubmitInput,
  ReviewApplicationInput,
  ReviewSubmissionInput,
  SubmitParticipationInput,
} from '@/shared/api';

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
  return useQuery({
    queryKey: queryKeys.mySubmissions,
    queryFn: () => api.getMySubmissions(),
    // Reviews and change requests arrive from the brand; always show the latest.
    refetchOnMount: 'always',
  });
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


/** Send a revised post after the brand asked for changes. */
export function useResubmit() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResubmitInput) => api.resubmitSubmission(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.mySubmissions }),
  });
}

/** The creator's own applications, so each campaign knows where they stand. */
export function useMyApplications() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: () => api.getMyApplications(),
    // A brand can decide at any moment; never show a stale "pending".
    refetchOnMount: 'always',
  });
}

/** Apply to a campaign, accepting its terms. Accepting an invitation is applying. */
export function useApplyToCampaign() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplyToCampaignInput) => api.applyToCampaign(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myApplications });
      queryClient.invalidateQueries({ queryKey: queryKeys.myInvitations });
    },
  });
}

export function useWithdrawApplication() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => api.withdrawApplication(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myApplications }),
  });
}

/** Private-campaign invitations still waiting for the creator's answer. */
export function useMyInvitations() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.myInvitations,
    queryFn: () => api.getMyInvitations(),
    refetchOnMount: 'always',
  });
}

export function useDeclineInvitation() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => api.declineInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myInvitations });
      queryClient.invalidateQueries({ queryKey: queryKeys.discoverCampaigns });
    },
  });
}

/** Applications to one of the brand's campaigns, for approve/decline. */
export function useCampaignApplications(campaignId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.campaignApplications(campaignId),
    queryFn: () => api.getCampaignApplications(campaignId),
  });
}

export function useReviewApplication() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewApplicationInput) => api.reviewApplication(input),
    onSuccess: (_result, input) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignApplications(input.campaignId) }),
  });
}
