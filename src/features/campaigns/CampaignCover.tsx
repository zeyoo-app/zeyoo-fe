'use client';

import { useState } from 'react';

import type { SocialPlatform } from '@/shared/api';
import { cn } from '@/design-system';

/**
 * A campaign's cover: the uploaded photo when there is one, otherwise a near-black
 * panel with a green radial glow, seeded per platform (the mobile gradient, in CSS).
 */
const GLOW_POSITION: Record<SocialPlatform, string> = {
  instagram: '50% 15%',
  tiktok: '65% 25%',
  snapchat: '42% 30%',
  youtube: '35% 20%',
};

export function CampaignCover({
  platform,
  imageUrl,
  className,
}: {
  platform: SocialPlatform;
  imageUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (imageUrl && !failed) {
    return (
      // A remote, user-uploaded photo of unknown size; next/image would need its host allow-listed.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        onError={() => setFailed(true)}
        className={cn('w-full bg-[#0b120d] object-cover', className)}
      />
    );
  }
  return (
    <div
      className={cn('relative overflow-hidden bg-[#0b120d]', className)}
      style={{
        backgroundImage: `radial-gradient(120% 90% at ${GLOW_POSITION[platform]}, rgba(0,227,125,0.35), transparent 60%)`,
      }}
    >
      <span className="absolute bottom-3 left-4 text-xs font-medium uppercase tracking-widest text-white/70">
        {platform}
      </span>
    </div>
  );
}
