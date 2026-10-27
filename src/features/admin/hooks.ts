'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from '@/shared/api';
import type { AdminCampaignStatus, AdminUserQuery } from '@/shared/api';

const ROOT = ['admin'] as const;

export function useAdminOverview() {
  const api = useApi();
  return useQuery({
    queryKey: [...ROOT, 'overview'],
    queryFn: () => api.getAdminOverview(),
    refetchInterval: 30_000,
  });
}

export function useAdminUsers(query: AdminUserQuery & { page?: number }) {
  const api = useApi();
  return useQuery({ queryKey: [...ROOT, 'users', query], queryFn: () => api.getAdminUsers(query) });
}

export function useAdminUserDetail(userId: string) {
  const api = useApi();
  return useQuery({
    queryKey: [...ROOT, 'user', userId],
    queryFn: () => api.getAdminUserDetail(userId),
  });
}

export function useAdminOrganizations(page: number) {
  const api = useApi();
  return useQuery({
    queryKey: [...ROOT, 'organizations', page],
    queryFn: () => api.getAdminOrganizations(page),
  });
}

export function useAdminCampaigns(query: { status?: AdminCampaignStatus; search?: string; page?: number }) {
  const api = useApi();
  return useQuery({
    queryKey: [...ROOT, 'campaigns', query],
    queryFn: () => api.getAdminCampaigns(query),
  });
}

export function useAdminFundings(page: number) {
  const api = useApi();
  return useQuery({
    queryKey: [...ROOT, 'fundings', page],
    queryFn: () => api.getAdminFundings(page),
  });
}

export function useAdminWithdrawals(scope: 'open' | 'history', page: number) {
  const api = useApi();
  return useQuery({
    queryKey: [...ROOT, 'withdrawals', scope, page],
    queryFn: () => api.getAdminWithdrawals(scope, page),
  });
}

export function useAdminVerifications(page: number) {
  const api = useApi();
  return useQuery({
    queryKey: [...ROOT, 'verifications', page],
    queryFn: () => api.getAdminVerifications(page),
  });
}

export function useAdminStaff() {
  const api = useApi();
  return useQuery({ queryKey: [...ROOT, 'staff'], queryFn: () => api.getAdminStaff() });
}

export function useAdminBilling() {
  const api = useApi();
  return useQuery({ queryKey: [...ROOT, 'billing'], queryFn: () => api.getAdminBilling() });
}

export function useAdminCategories() {
  const api = useApi();
  return useQuery({ queryKey: [...ROOT, 'categories'], queryFn: () => api.getAdminCategories() });
}

export function useAdminAuditLog(page: number) {
  const api = useApi();
  return useQuery({
    queryKey: [...ROOT, 'audit', page],
    queryFn: () => api.getAdminAuditLog(page),
  });
}

/** Any admin write can change counts and lists across screens, so refresh them all. */
function useRefreshAdmin() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ROOT });
}

export function useSetUserSuspended() {
  const api = useApi();
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: (input: { userId: string; suspended: boolean }) => api.setAdminUserSuspended(input),
    onSuccess: refresh,
  });
}

export function useCloseCampaign() {
  const api = useApi();
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: (campaignId: string) => api.closeAdminCampaign(campaignId),
    onSuccess: refresh,
  });
}

export function useRefundCampaign() {
  const api = useApi();
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: (campaignId: string) => api.refundAdminCampaign(campaignId),
    onSuccess: refresh,
  });
}

export function useDecideWithdrawal() {
  const api = useApi();
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: (input: {
      withdrawalId: string;
      action: 'approve' | 'reject' | 'hold' | 'release';
      reason?: string;
    }) => api.decideAdminWithdrawal(input),
    onSuccess: refresh,
  });
}

export function useCreateCategory() {
  const api = useApi();
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: (name: string) => api.createAdminCategory(name),
    onSuccess: refresh,
  });
}

export function useReviewVerification() {
  const api = useApi();
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: (input: { userId: string; approve: boolean; note?: string }) =>
      api.reviewAdminVerification(input),
    onSuccess: refresh,
  });
}

export function useAddStaff() {
  const api = useApi();
  const refresh = useRefreshAdmin();
  return useMutation({ mutationFn: (email: string) => api.addAdminStaff(email), onSuccess: refresh });
}

export function useSetStaffActive() {
  const api = useApi();
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: (input: { staffId: string; active: boolean }) => api.setAdminStaffActive(input),
    onSuccess: refresh,
  });
}
