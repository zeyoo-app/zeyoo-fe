'use client';

import { Mail, Phone } from 'lucide-react';

import type { AuthChannel } from './channel';

/**
 * The alternative sign-in channel, styled like the Google button so phone and email
 * read as equal first-class options rather than a footnote link.
 */
export function AuthChannelSwitch({
  value,
  onChange,
}: {
  value: AuthChannel;
  onChange: (value: AuthChannel) => void;
}) {
  const nextChannel: AuthChannel = value === 'email' ? 'phone' : 'email';
  const label = value === 'email' ? 'Continue with phone number' : 'Continue with email';
  const Icon = value === 'email' ? Phone : Mail;

  return (
    <button
      type="button"
      onClick={() => onChange(nextChannel)}
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface text-[15px] font-medium text-text transition-colors hover:bg-surface-hover"
    >
      <Icon className="size-[18px]" />
      {label}
    </button>
  );
}
