import { cn } from '../lib/cn';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

/** A monogram avatar derived from the first character of a name. */
export function Avatar({ name, size = 40, className }: AvatarProps) {
  const initial = name.replace(/[@\s]/g, '').charAt(0).toUpperCase() || '?';
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised font-medium text-green-text',
        className,
      )}
    >
      {initial}
    </span>
  );
}
