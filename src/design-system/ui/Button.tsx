'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  /**
   * Renders an anchor instead of a button. Needed where the browser owns the
   * navigation — `mailto:`, a download, a new tab — so the control keeps a real href
   * instead of faking one behind a click handler.
   */
  href?: string;
  target?: string;
  rel?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-border bg-surface text-text hover:bg-surface-hover',
  ghost: 'text-text hover:bg-surface-hover',
  danger: 'bg-danger text-white hover:opacity-90',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'h-12 px-5 text-[15px]',
  sm: 'h-10 px-4 text-[13px]',
};

/**
 * Primary is the only filled-green control (design.md §6); text on green is always
 * near-black. All buttons share the same rounded, medium-weight shape.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = true,
    disabled,
    className,
    children,
    href,
    target,
    rel,
    ...rest
  },
  ref,
) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-primary',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && 'w-full',
    className,
  );

  if (href !== undefined) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        aria-disabled={disabled || loading || undefined}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={classes}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : children}
    </button>
  );
});
