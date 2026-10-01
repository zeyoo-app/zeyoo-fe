'use client';

import { Moon, Sun } from 'lucide-react';

import { cn, useTheme } from '@/design-system';

/** Compact landing-page theme control with an explicit, accessible switch state. */
export function LandingThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Use light mode' : 'Use dark mode'}
      title={dark ? 'Use light mode' : 'Use dark mode'}
      onClick={toggleTheme}
      className="group inline-flex h-10 items-center gap-2 rounded-xl px-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Sun className={cn('size-4 transition-colors', !dark && 'text-text')} aria-hidden />
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          dark ? 'bg-primary' : 'bg-surface-hover ring-1 ring-border',
        )}
      >
        <span
          className={cn(
            'size-5 rounded-full bg-white transition-transform duration-200',
            dark ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </span>
      <Moon className={cn('size-4 transition-colors', dark && 'text-primary')} aria-hidden />
    </button>
  );
}
