'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createBackendApi, type SessionChannel } from './backendApi';
import type { ZeyooApi } from './ZeyooApi';
import { registerAuthQueryCleanup } from '@/shared/auth';

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
export function ApiProvider({
  children,
  client,
  channel,
}: {
  children: ReactNode;
  client?: ZeyooApi;
  /** Which session this client signs requests with; the app's by default. */
  channel?: SessionChannel;
}) {
  const api = useMemo(() => client ?? createConfiguredApi(channel), [client, channel]);
  const [queryClient] = useState(createQueryClient);
  useEffect(() => registerAuthQueryCleanup(() => { queryClient.clear(); api.resetSession?.(); }), [api, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </QueryClientProvider>
  );
}

function createConfiguredApi(channel?: SessionChannel): ZeyooApi {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error('NEXT_PUBLIC_API_BASE_URL is required.');
  return createBackendApi(baseUrl, channel);
}

export function useApi(): ZeyooApi {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error('useApi must be used within an ApiProvider.');
  }
  return api;
}
