'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type { BillingPlan, RedirectUrl, WithdrawInput } from '@/shared/api';

/** Hands the browser to a hosted Stripe page (payout setup, checkout, card entry). */
function openHostedPage({ url }: RedirectUrl) {
  window.location.assign(url);
}

export function useWallet() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.wallet, queryFn: () => api.getWallet() });
}

export function useLedger() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.ledger, queryFn: () => api.getLedger() });
}

export function useConnectPayout() {
  const api = useApi();
  return useMutation({
    mutationFn: () => api.connectPayout(),
    onSuccess: openHostedPage,
  });
}

export function useRequestWithdrawal() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WithdrawInput) => api.requestWithdrawal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger });
    },
  });
}

export function useBrandBilling() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.brandBilling, queryFn: () => api.getBrandBilling() });
}

export function useBrandLedger() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.brandLedger, queryFn: () => api.getBrandLedger() });
}

export function useSetBillingPlan() {
  const api = useApi();
  return useMutation({
    mutationFn: (plan: BillingPlan) => api.setBillingPlan(plan),
    onSuccess: openHostedPage,
  });
}

export function useAddPaymentMethod() {
  const api = useApi();
  return useMutation({
    mutationFn: () => api.setBrandPaymentMethod(),
    onSuccess: openHostedPage,
  });
}
