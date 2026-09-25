import type { Role } from '../api/types';

/** The landing route for a fully signed-in user of the given role. */
export function homePathForRole(role: Role): string {
  return role === 'brand' ? '/brand/dashboard' : '/creator/discover';
}
