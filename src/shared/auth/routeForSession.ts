import type { Session } from '../api/types';

/** The single post-auth routing policy, including both role onboarding gates. */
export function routeForSession(session: Session): string {
  if (session.role === 'brand') {
    return session.hasOrganization ? '/brand/dashboard' : '/brand/setup';
  }
  return session.hasCreatorProfile === false ? '/creator/setup' : '/creator/discover';
}
