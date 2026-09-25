'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createMockApi } from './mockApi';
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
 * Provides the backend client + TanStack Query to the tree. Today it wires the
 * in-memory mock; going live means swapping `createMockApi()` for the generated
 * SDK client — nothing else in the app changes (IMPLEMENTATION_PLAN §6).
 */
export function ApiProvider({ children, client }: { children: ReactNode; client?: ZeyooApi }) {
  const api = useMemo(() => client ?? createMockApi(), [client]);
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </QueryClientProvider>
  );
}

export function useApi(): ZeyooApi {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error('useApi must be used within an ApiProvider.');
  }
  return api;
}
