import type { SocialPlatform } from '@/shared/api';

/**
 * Display names for the social platforms a creator can publish on. One record,
 * keyed by the whole union, so a newly added platform fails the build here
 * rather than rendering as a raw slug somewhere in the UI.
 */
const LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  youtube: 'YouTube',
};

export function platformLabel(platform: SocialPlatform): string {
  return LABELS[platform];
}

/** "Instagram, TikTok" — every platform a campaign accepts, in the order it was chosen. */
export function platformsLabel(platforms: SocialPlatform[]): string {
  return platforms.map(platformLabel).join(', ');
}

/** The order platforms are listed in wherever a creator picks or reviews them. */
export const SOCIAL_PLATFORM_ORDER: SocialPlatform[] = ['instagram', 'tiktok', 'youtube', 'snapchat'];
