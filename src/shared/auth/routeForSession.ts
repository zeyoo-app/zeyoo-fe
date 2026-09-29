import type { Session } from '../api/types';

/** The single post-auth routing policy, including both role onboarding gates. */
export function routeForSession(session: Session): string {
  if (!session.emailVerified) return '/confirm-email';
  if (session.role === 'brand') {
    return session.hasOrganization ? '/brand/dashboard' : '/brand/setup';
  }
  return session.hasCreatorProfile === false ? '/creator/setup' : '/creator/discover';
}
