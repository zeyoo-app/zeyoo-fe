'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type { AddPaymentMethodInput, BillingPlan, WithdrawInput } from '@/shared/api';

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.connectPayout(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet }),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: BillingPlan) => api.setBillingPlan(plan),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.brandBilling }),
  });
}

export function useAddPaymentMethod() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPaymentMethodInput) => api.setBrandPaymentMethod(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.brandBilling }),
  });
}
