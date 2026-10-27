'use client';

import type { ComponentType, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Banknote,
  BadgeCheck,
  ShieldCheck,
  Receipt,
  Building2,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  ShieldAlert,
  Tags,
  Users,
  X,
} from 'lucide-react';

import { Logo, cn } from '@/design-system';
import { STAFF_SESSION_EXPIRED_EVENT } from '@/shared/auth/sessionEvents';

import { useAdminOverview } from './hooks';
import { useStaffSession } from './staffSession';

type QueueKey = 'withdrawals' | 'disputes' | 'fraud' | 'verifications';

interface AdminNavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Shows how many items in this queue are waiting for staff. */
  queue?: QueueKey;
}

interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

/** Add a section or an item here and it appears in the sidebar. */
const ADMIN_NAV: AdminNavSection[] = [
  {
    title: 'Operations',
    items: [
      { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
      {
        href: '/admin/withdrawals',
        label: 'Withdrawals',
        icon: Banknote,
        queue: 'withdrawals',
      },
      {
        href: '/admin/disputes',
        label: 'Disputes',
        icon: Scale,
        queue: 'disputes',
      },
      {
        href: '/admin/fraud',
        label: 'Earnings reviews',
        icon: ShieldAlert,
        queue: 'fraud',
      },
      {
        href: '/admin/verifications',
        label: 'Verifications',
        icon: BadgeCheck,
        queue: 'verifications',
      },
    ],
  },
  {
    title: 'Platform',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
      { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/billing', label: 'Billing', icon: Receipt },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/admin/staff', label: 'Staff', icon: ShieldCheck },
      { href: '/admin/categories', label: 'Categories', icon: Tags },
      { href: '/admin/audit', label: 'Audit log', icon: ListChecks },
    ],
  },
];

const COLLAPSED_KEY = 'zeyoo.admin.sidebarCollapsed';

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function storeCollapsed(value: boolean): void {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0');
  } catch {
    // Preference only; the sidebar works without it.
  }
}

/** Staff-only frame. Without a back-office session, staff are sent to its sign-in. */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useStaffSession((state) => state.status);
  const session = useStaffSession((state) => state.staff);
  const signOut = useStaffSession((state) => state.signOut);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  // The drawer is open only for the page it was opened on, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const setDrawerOpen = (open: boolean) => setDrawerPath(open ? pathname : null);
  const allowed = status === 'authenticated';

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/admin/sign-in');
  }, [status, router]);

  // The API gave up on the staff session (expired or deactivated): back to sign-in.
  useEffect(() => {
    const onExpired = (): void => signOut();
    window.addEventListener(STAFF_SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(STAFF_SESSION_EXPIRED_EVENT, onExpired);
  }, [signOut]);

  if (!allowed) {
    return <div className="min-h-dvh bg-bg" aria-busy />;
  }

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      storeCollapsed(!current);
      return !current;
    });
  };
  const handleSignOut = () => {
    signOut();
    router.replace('/admin/sign-in');
  };

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <Logo height={22} />
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-text-muted hover:bg-surface-hover"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative h-full w-64 bg-surface">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute end-3 top-4 rounded-lg p-2 text-text-muted hover:bg-surface-hover"
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              collapsed={false}
              email={session?.email ?? ''}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      ) : null}

      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-border bg-surface transition-[width] duration-200 md:flex',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        <SidebarContent
          pathname={pathname}
          collapsed={collapsed}
          email={session?.email ?? ''}
          onToggle={toggleCollapsed}
          onSignOut={handleSignOut}
        />
      </aside>

      <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}

function SidebarContent({
  pathname,
  collapsed,
  email,
  onToggle,
  onSignOut,
}: {
  pathname: string;
  collapsed: boolean;
  email: string;
  onToggle?: () => void;
  onSignOut: () => void;
}) {
  const overview = useAdminOverview().data;
  const queueCounts: Record<QueueKey, number> = {
    withdrawals: (overview?.queues.withdrawalsRequested ?? 0) + (overview?.queues.withdrawalsHeld ?? 0),
    disputes: overview?.queues.disputesActive ?? 0,
    fraud: overview?.queues.fraudCasesOpen ?? 0,
    verifications: overview?.queues.verificationsPending ?? 0,
  };
  return (
    <div className="flex h-full flex-col px-3 py-5">
      <div className={cn('flex items-center gap-2 px-2', collapsed && 'justify-center px-0')}>
        {collapsed ? (
          <span className="font-display text-xl font-semibold text-text">z</span>
        ) : (
          <>
            <Logo height={22} />
            <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-text-muted">
              Admin
            </span>
          </>
        )}
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-6 overflow-y-auto">
        {ADMIN_NAV.map((section) => (
          <div key={section.title} className="flex flex-col gap-1">
            {collapsed ? null : (
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const waiting = item.queue ? queueCounts[item.queue] : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-primary/15 text-green-text'
                      : 'text-text-muted hover:bg-surface-hover hover:text-text',
                  )}
                >
                  <item.icon className="size-5 shrink-0" />
                  {collapsed ? (
                    <span className="sr-only">{item.label}</span>
                  ) : (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {waiting > 0 ? (
                    <span
                      className={cn(
                        'rounded-full bg-warning/20 px-1.5 text-[11px] font-semibold text-warning',
                        collapsed && 'absolute end-1 top-1',
                      )}
                    >
                      {waiting}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border pt-3">
        {!collapsed && email ? (
          <p className="truncate px-3 pb-1 text-xs text-text-tertiary">{email}</p>
        ) : null}
        <button
          type="button"
          onClick={onSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {collapsed ? <span className="sr-only">Sign out</span> : 'Sign out'}
        </button>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="size-5 shrink-0" />
                Collapse
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
