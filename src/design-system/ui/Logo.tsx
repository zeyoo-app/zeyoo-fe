import Image from 'next/image';

const WORDMARK_ASPECT = 1946 / 497;

/**
 * The Zeyoo wordmark (signed green artwork: mark + lettering). The artwork carries
 * its own colours and reads on both light and dark surfaces (design.md §2.1) — never
 * tint it, which would flatten the accent. `height` drives size; width follows aspect.
 */
export function Logo({ height = 28, className }: { height?: number; className?: string }) {
  return (
    <Image
      src="/brand/wordmark.png"
      alt="Zeyoo"
      height={height}
      width={Math.round(height * WORDMARK_ASPECT)}
      priority
      className={className}
    />
  );
}
