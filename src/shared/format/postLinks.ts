import type { PostPlatform } from '@/shared/api';

const HOSTS: { platform: PostPlatform; pattern: RegExp }[] = [
  { platform: 'tiktok', pattern: /(^|\.)tiktok\.com$/ },
  { platform: 'instagram', pattern: /(^|\.)instagram\.com$/ },
  { platform: 'youtube', pattern: /(^|\.)youtube\.com$|^youtu\.be$/ },
  { platform: 'snapchat', pattern: /(^|\.)snapchat\.com$/ },
  { platform: 'x', pattern: /(^|\.)(x|twitter)\.com$/ },
];

export const POST_LINK_PLACEHOLDERS: Record<PostPlatform, string> = {
  tiktok: 'https://www.tiktok.com/@you/video/...',
  instagram: 'https://www.instagram.com/reel/...',
  youtube: 'https://youtube.com/shorts/...',
  snapchat: 'https://www.snapchat.com/spotlight/...',
  x: 'https://x.com/you/status/...',
};

/** A real web link — not just any text with a dot in it. */
export function isPostUrl(value: string): boolean {
  return parseUrl(value) !== null;
}

/** The platform a link's address belongs to, or null for a host we don't recognise. */
export function platformOfLink(value: string): PostPlatform | null {
  const url = parseUrl(value);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  return HOSTS.find((entry) => entry.pattern.test(host))?.platform ?? null;
}

/**
 * Why a link can't go under `platform`, or null when it can. A link on an unrecognised
 * host (a link shortener, say) is accepted; the server makes the same call.
 */
export function postLinkProblem(value: string, platform: PostPlatform): string | null {
  if (!isPostUrl(value)) return 'Paste the full link to your post, starting with https://';
  const linkPlatform = platformOfLink(value);
  if (linkPlatform && linkPlatform !== platform) return 'This link is for a different platform.';
  return null;
}

function parseUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.hostname.includes('.') ? url : null;
  } catch {
    return null;
  }
}
