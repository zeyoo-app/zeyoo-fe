import type { SocialPlatform } from '@/shared/api';
import { cn } from '@/design-system';

/**
 * A campaign's cover: a near-black panel with a green radial glow, seeded per
 * platform so each campaign reads distinctly (the mobile gradient, in CSS).
 */
const GLOW_POSITION: Record<SocialPlatform, string> = {
  instagram: '50% 15%',
  tiktok: '65% 25%',
  youtube: '35% 20%',
};

export function CampaignCover({ platform, className }: { platform: SocialPlatform; className?: string }) {
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
