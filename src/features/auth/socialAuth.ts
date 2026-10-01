import type { OAuthProvider, Role } from '@/shared/api';

const STORAGE_KEY = 'zeyoo.google-oauth';
const CALLBACK_PATH = '/api/auth/callback/google';

interface PendingGoogleSignIn {
  state: string;
  nonce: string;
  role: Role;
}

/** The redirect URI registered in Google Cloud Console for this origin. */
export function googleRedirectUri(): string {
  return `${window.location.origin}${CALLBACK_PATH}`;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sends the browser to Google's consent screen (OpenID Connect implicit flow).
 * Google redirects back to `/api/auth/callback/google` with an ID token in the URL
 * fragment, which `completeGoogleSignIn` validates and hands to the backend.
 */
export function startGoogleSignIn(role: Role): void {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.');

  const pending: PendingGoogleSignIn = { state: randomToken(), nonce: randomToken(), role };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: 'id_token',
    scope: 'openid email profile',
    state: pending.state,
    nonce: pending.nonce,
    prompt: 'select_account',
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

/**
 * Validates Google's redirect (state + nonce) and returns the ID token and the role
 * chosen before leaving. The backend still verifies the token's signature/audience.
 */
export function completeGoogleSignIn(fragment: string): { idToken: string; role: Role } {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!raw) throw new Error('No Google sign-in in progress.');
  const pending = JSON.parse(raw) as PendingGoogleSignIn;

  const params = new URLSearchParams(fragment.replace(/^#/, ''));
  const idToken = params.get('id_token');
  if (params.get('state') !== pending.state || !idToken) throw new Error('Invalid Google response.');

  const payload = JSON.parse(atob(idToken.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as {
    nonce?: string;
  };
  if (payload.nonce !== pending.nonce) throw new Error('Invalid Google response.');

  return { idToken, role: pending.role };
}

/** Apple sign-in is not available on web yet. */
export async function acquireIdToken(provider: OAuthProvider): Promise<string> {
  throw new Error(`${provider === 'apple' ? 'Apple' : 'Google'} sign-in is not configured yet.`);
}
