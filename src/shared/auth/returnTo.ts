import type { Session } from '../api/types';
import { routeForSession } from './routeForSession';

const STORAGE_KEY = 'zeyoo.returnTo';

/**
 * Remembers the page a signed-out visitor was sent away from (typically a link from an
 * email or notification), so signing in lands them back on it instead of their home.
 */
export function rememberReturnTo(path: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    // Storage can be unavailable (private mode); the visitor then lands on their home.
  }
}

/**
 * Where to go after signing in: the remembered page when it belongs to this session's
 * role and onboarding is done, otherwise the normal post-auth route. Reading it clears it.
 */
export function routeAfterSignIn(session: Session): string {
  let remembered: string | null = null;
  try {
    remembered = window.sessionStorage.getItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    remembered = null;
  }
  const home = routeForSession(session);
  if (!remembered || !isSafeInternalPath(remembered)) return home;
  const onboarded =
    session.role === 'brand' ? session.hasOrganization !== false : session.hasCreatorProfile !== false;
  if (!onboarded) return home;
  const otherRole = session.role === 'brand' ? '/creator' : '/brand';
  if (remembered.startsWith(otherRole) || remembered.startsWith('/admin')) return home;
  return remembered;
}

/** A same-site path only: never a protocol-relative or absolute URL. */
function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}
