'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Moon, Settings, Sun } from 'lucide-react';

import { Logo, cn, useTheme } from '@/design-system';
import type { Role } from '@/shared/api';
import { useAuthStore, useRequireRole } from '@/shared/auth';

import { LocaleSwitcher } from './LocaleSwitcher';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface AppShellProps {
  role: Role;
  nav: NavItem[];
  children: React.ReactNode;
}

/** The role-gated application frame: sidebar on desktop, bottom tab bar on mobile. */
export function AppShell({ role, nav, children }: AppShellProps) {
  const { ready } = useRequireRole(role);

  if (!ready) {
    return <div className="min-h-dvh bg-bg" aria-busy />;
  }

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar nav={nav} />
      <MobileTopBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">
        {children}
      </main>
      <MobileTabBar nav={nav} />
    </div>
  );
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-e border-border bg-surface px-4 py-6 md:flex">
      <div className="px-2">
        <Logo height={24} />
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-surface-raised text-text' : 'text-text-muted hover:bg-surface-hover hover:text-text',
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <SidebarFooter />
    </aside>
  );
}

function SidebarFooter() {
  return (
    <div className="flex flex-col gap-1 border-t border-border pt-3">
      <SidebarLink href="/notifications" icon={Bell} label="Notifications" />
      <SidebarLink href="/settings" icon={Settings} label="Settings" />
      <div className="flex items-center gap-1 px-1">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <SignOutButton />
    </div>
  );
}

function SidebarLink({ href, icon: Icon, label }: NavItem) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        active ? 'bg-surface-raised text-text' : 'text-text-muted hover:bg-surface-hover hover:text-text',
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-lg p-2 text-text-muted hover:bg-surface-hover"
    >
      {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

function SignOutButton() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  return (
    <button
      onClick={() => {
        signOut();
        router.replace('/sign-in');
      }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text"
    >
      <LogOut className="size-5" />
      Sign out
    </button>
  );
}

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
      <Logo height={22} />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <LocaleSwitcher />
        <Link href="/notifications" aria-label="Notifications" className="rounded-lg p-2 text-text-muted hover:bg-surface-hover">
          <Bell className="size-5" />
        </Link>
      </div>
    </header>
  );
}

function MobileTabBar({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur md:hidden">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]', active ? 'text-green-text' : 'text-text-muted')}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
