'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';

/** The reviews of the signed-in creator's earnings that brands have opened. */
export function useMyFraudCases() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.myFraudCases, queryFn: () => api.getMyFraudCases() });
}
