'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApi } from '@/shared/api';
import type {
  ConnectablePlatform,
  CreatorProfile,
  SocialPlatform,
  UpdateBrandProfileInput,
  UpdateProfileInput,
} from '@/shared/api';

export function useCreatorProfile() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.creatorProfile, queryFn: () => api.getCreatorProfile() });
}

export function useBrandProfile() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.brandProfile, queryFn: () => api.getBrandProfile() });
}

export function useUpdateBrandProfile() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBrandProfileInput) => api.updateBrandProfile(input),
    onSuccess: (profile) => queryClient.setQueryData(queryKeys.brandProfile, profile),
  });
}

/** Caches the returned profile so every creator-profile mutation refreshes the view. */
function useCacheProfile() {
  const queryClient = useQueryClient();
  return (profile: CreatorProfile) => queryClient.setQueryData(queryKeys.creatorProfile, profile);
}

export function useUpdateProfile() {
  const api = useApi();
  const cacheProfile = useCacheProfile();
  return useMutation({ mutationFn: (input: UpdateProfileInput) => api.updateProfile(input), onSuccess: cacheProfile });
}

export function useStartVerification() {
  const api = useApi();
  const cacheProfile = useCacheProfile();
  return useMutation({ mutationFn: () => api.startVerification(), onSuccess: cacheProfile });
}

/** Sends the creator to the platform's own sign-in page to authorise their account. */
export function useStartPlatformConnection() {
  const api = useApi();
  return useMutation({
    mutationFn: async (platform: ConnectablePlatform) => {
      const { authorizationUrl } = await api.startPlatformConnection({ platform, client: 'web' });
      window.location.assign(authorizationUrl);
    },
  });
}

export function useConnectSocial() {
  const api = useApi();
  const cacheProfile = useCacheProfile();
  return useMutation({ mutationFn: (platform: SocialPlatform) => api.connectSocial(platform), onSuccess: cacheProfile });
}
