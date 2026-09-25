import { Compass, Home, LayoutGrid, ListChecks, User, Users, Wallet } from 'lucide-react';

import type { Role } from '@/shared/api';

import type { NavItem } from './AppShell';

const BRAND_NAV: NavItem[] = [
  { href: '/brand/dashboard', label: 'Home', icon: Home },
  { href: '/brand/campaigns', label: 'Campaigns', icon: LayoutGrid },
  { href: '/brand/creators', label: 'Creators', icon: Users },
  { href: '/brand/wallet', label: 'Wallet', icon: Wallet },
  { href: '/brand/profile', label: 'Profile', icon: User },
];

const CREATOR_NAV: NavItem[] = [
  { href: '/creator/discover', label: 'Discover', icon: Compass },
  { href: '/creator/submissions', label: 'Submissions', icon: ListChecks },
  { href: '/creator/wallet', label: 'Wallet', icon: Wallet },
  { href: '/creator/profile', label: 'Profile', icon: User },
];

export function navForRole(role: Role): NavItem[] {
  return role === 'brand' ? BRAND_NAV : CREATOR_NAV;
}
