'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type { BillingPlan, Money, RedirectUrl, WithdrawInput } from '@/shared/api';

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

/** Sends the brand to Stripe Checkout to add money to their wallet. */
export function useTopUpWallet() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: Money) => api.topUpWallet(amount),
    onSuccess: (topUp) => {
      if (topUp.checkoutUrl) {
        window.location.assign(topUp.checkoutUrl);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.brandBilling });
      void queryClient.invalidateQueries({ queryKey: queryKeys.brandLedger });
    },
  });
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

export function useBillingPlans() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.billingPlans, queryFn: () => api.getBillingPlans() });
}

/**
 * Chooses a plan. From Starter it sends the browser to Stripe Checkout; a paying brand
 * is switched in place (Stripe adjusts the next invoice) and the page updates at once.
 */
export function useSetBillingPlan() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: BillingPlan) => api.setBillingPlan(plan),
    onSuccess: (change) => {
      if (change.checkoutUrl) {
        window.location.assign(change.checkoutUrl);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.brandBilling });
    },
  });
}

export function useCancelBillingPlan() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.cancelBillingPlan(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.brandBilling }),
  });
}

export function useResumeBillingPlan() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.resumeBillingPlan(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.brandBilling }),
  });
}

export function useAddPaymentMethod() {
  const api = useApi();
  return useMutation({
    mutationFn: () => api.setBrandPaymentMethod(),
    onSuccess: openHostedPage,
  });
}
