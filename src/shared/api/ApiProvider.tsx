'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createBackendApi } from './backendApi';
import type { ZeyooApi } from './ZeyooApi';

const ApiContext = createContext<ZeyooApi | null>(null);

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    },
  });
}

/**
 * Provides the real backend client and TanStack Query to the application.
 */
export function ApiProvider({ children, client }: { children: ReactNode; client?: ZeyooApi }) {
  const api = useMemo(() => client ?? createConfiguredApi(), [client]);
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </QueryClientProvider>
  );
}

function createConfiguredApi(): ZeyooApi {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error('NEXT_PUBLIC_API_BASE_URL is required.');
  return createBackendApi(baseUrl);
}

export function useApi(): ZeyooApi {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error('useApi must be used within an ApiProvider.');
  }
  return api;
}
