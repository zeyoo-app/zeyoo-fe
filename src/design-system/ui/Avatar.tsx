'use client';

import { useState } from 'react';

import { cn } from '../lib/cn';

interface AvatarProps {
  name: string;
  /** A photo to show instead of the monogram; falls back to the monogram if it fails to load. */
  src?: string;
  size?: number;
  className?: string;
}

/** A round avatar: the person's photo when there is one, otherwise a monogram of their name. */
export function Avatar({ name, src, size = 40, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.replace(/[@\s]/g, '').charAt(0).toUpperCase() || '?';
  const showPhoto = Boolean(src) && !failed;

  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-raised font-medium text-green-text',
        className,
      )}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote user photo of unknown size
        <img src={src} alt="" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
