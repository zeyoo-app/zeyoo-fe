'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';

import { useUnreadCount } from './hooks';

/**
 * A header bell carrying the unread badge. The count comes from the same query
 * the notifications screen renders, so the badge and the list can never drift.
 */
export function NotificationBell({ className }: { className?: string }) {
  const unread = useUnreadCount();

  return (
    <Link
      href="/notifications"
      aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      className={`relative flex size-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text ${className ?? ''}`}
    >
      <Bell className="size-5" aria-hidden />
      {unread > 0 ? (
        <span className="absolute end-0.5 top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-[18px] text-on-primary">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </Link>
  );
}
