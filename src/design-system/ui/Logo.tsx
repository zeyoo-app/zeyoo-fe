import Image from 'next/image';

import { cn } from '../lib/cn';

const WORDMARK_ASPECT = 1946 / 497;

/**
 * The Zeyoo wordmark (transparent artwork: green mark + lettering). Two theme
 * variants are swapped purely in CSS so the correct one paints on first render:
 * dark lettering on light surfaces, white lettering on dark (design.md §2.1).
 * `height` drives size; width follows the source aspect ratio.
 */
export function Logo({ height = 28, className }: { height?: number; className?: string }) {
  const width = Math.round(height * WORDMARK_ASPECT);

  return (
    <>
      <Image alt="Zeyoo" height={height} width={width} priority src="/brand/wordmark-light.png" className={cn('dark:hidden', className)} />
      <Image alt="Zeyoo" height={height} width={width} priority src="/brand/wordmark-dark.png" className={cn('hidden dark:block', className)} />
    </>
  );
}
