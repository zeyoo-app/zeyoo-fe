'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type { DecideDisputeInput, FraudCase, OpenDisputeInput } from '@/shared/api';

export function useDisputes() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.disputes, queryFn: () => api.getDisputes() });
}

export function useDispute(disputeId: string) {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.disputes, disputeId],
    queryFn: () => api.getDispute(disputeId),
  });
}

export function useOpenDispute() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OpenDisputeInput) => api.openDispute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.disputes }),
  });
}

export function useSendDisputeMessage(disputeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => api.sendDisputeMessage({ disputeId, message }),
    onSuccess: (dispute) => {
      queryClient.setQueryData([...queryKeys.disputes, disputeId], dispute);
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes });
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    },
  });
}

export function useAdminDisputes(scope: 'active' | 'closed') {
  const api = useApi();
  return useQuery({
    queryKey: ['admin', 'disputes', scope],
    queryFn: () => api.getAdminDisputes(scope),
  });
}

function useRefreshAdminDisputes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
}

export function useReviewDispute() {
  const api = useApi();
  const refresh = useRefreshAdminDisputes();
  return useMutation({ mutationFn: (disputeId: string) => api.reviewDispute(disputeId), onSuccess: refresh });
}

export function useDecideDispute() {
  const api = useApi();
  const refresh = useRefreshAdminDisputes();
  return useMutation({
    mutationFn: (input: DecideDisputeInput) => api.decideDispute(input),
    onSuccess: refresh,
  });
}

export function useAdminFraudCases(status?: FraudCase['status']) {
  const api = useApi();
  return useQuery({
    queryKey: ['admin', 'fraud', status ?? 'all'],
    queryFn: () => api.getAdminFraudCases(status),
  });
}

export function useAdminCloseFraudCase() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { caseId: string; action: 'confirm' | 'clear' }) =>
      api.adminCloseFraudCase(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'fraud'] }),
  });
}

/** Escalate a dispute support has not answered within its response time. */
export function useEscalateDispute(disputeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.escalateDispute(disputeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.disputes }),
  });
}
