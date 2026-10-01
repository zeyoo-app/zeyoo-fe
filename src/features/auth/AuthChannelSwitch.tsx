'use client';

import type { AuthChannel } from './channel';

export function AuthChannelSwitch({
  value,
  onChange,
}: {
  value: AuthChannel;
  onChange: (value: AuthChannel) => void;
}) {
  const nextChannel: AuthChannel = value === 'email' ? 'phone' : 'email';
  const label = value === 'email' ? 'Use phone number instead' : 'Use email instead';

  return (
    <button
      type="button"
      onClick={() => onChange(nextChannel)}
      className="self-center px-2 py-3 text-[13px] font-semibold text-text underline underline-offset-2"
    >
      {label}
    </button>
  );
}
