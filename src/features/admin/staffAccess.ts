import type { StaffRole } from '@/shared/api';

/**
 * Back-office areas and which staff roles open them. Mirrors the API's role
 * permissions (zeyoo-be src/platform/rbac/roles.ts), which stay the real gate:
 * this only keeps the sidebar to what a person can use.
 */
export type StaffArea =
  | 'overview'
  | 'people'
  | 'campaigns'
  | 'finance'
  | 'trust'
  | 'settings'
  | 'audit'
  | 'staff';

const ALL_AREAS: StaffArea[] = ['overview', 'people', 'campaigns', 'finance', 'trust', 'settings', 'audit'];

const ROLE_AREAS: Record<StaffRole, StaffArea[]> = {
  SUPER_ADMIN: [...ALL_AREAS, 'staff'],
  ADMINISTRATOR: ALL_AREAS,
  SUPPORT: ['overview', 'people', 'campaigns', 'trust'],
  FINANCE: ['overview', 'finance', 'audit'],
};

export const STAFF_ROLES: StaffRole[] = ['SUPER_ADMIN', 'ADMINISTRATOR', 'SUPPORT', 'FINANCE'];

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMINISTRATOR: 'Admin',
  SUPPORT: 'Support',
  FINANCE: 'Finance',
};

/** One line on what the role can do, shown where a role is chosen. */
export const STAFF_ROLE_SUMMARY: Record<StaffRole, string> = {
  SUPER_ADMIN: 'Everything, including adding and removing staff.',
  ADMINISTRATOR: 'Every area of the back office, but not staff.',
  SUPPORT: 'Users, organizations, verifications, campaigns, disputes and fraud.',
  FINANCE: 'Withdrawals, payments, billing and the audit log.',
};

const PATH_AREAS: [prefix: string, area: StaffArea][] = [
  ['/admin/overview', 'overview'],
  ['/admin/users', 'people'],
  ['/admin/organizations', 'people'],
  ['/admin/verifications', 'people'],
  ['/admin/campaigns', 'campaigns'],
  ['/admin/categories', 'campaigns'],
  ['/admin/withdrawals', 'finance'],
  ['/admin/payments', 'finance'],
  ['/admin/billing', 'finance'],
  ['/admin/disputes', 'trust'],
  ['/admin/fraud', 'trust'],
  ['/admin/ai', 'settings'],
  ['/admin/audit', 'audit'],
  ['/admin/staff', 'staff'],
];

export function areaForPath(pathname: string): StaffArea | null {
  const match = PATH_AREAS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? match[1] : null;
}

export function canOpen(role: StaffRole | undefined, area: StaffArea): boolean {
  return role ? ROLE_AREAS[role]?.includes(area) ?? false : false;
}
