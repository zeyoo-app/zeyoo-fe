import type { SocialPlatform } from '@/shared/api';
import { platformLabel, SOCIAL_PLATFORM_ORDER } from '@/shared/format/platform';

/**
 * The social platforms a creator can connect, in display order. Both the connect
 * screen and the connected-count summary on the profile read this list, so they
 * can never disagree about how many platforms exist.
 */
export const SOCIAL_PLATFORMS: { platform: SocialPlatform; label: string }[] = SOCIAL_PLATFORM_ORDER.map(
  (platform) => ({ platform, label: platformLabel(platform) }),
);
