import type { OAuthProvider } from '@/shared/api';

/**
 * Obtains a provider ID token to exchange with the backend.
 *
 * Production builds acquire this via each provider's web SDK (Google Identity
 * Services, Sign in with Apple JS) once client IDs are configured. Until then we
 * return a self-describing dev token; the backend's OAuth verifier accepts an
 * unsigned token only outside production and only when no client IDs are set (see
 * zeyoo-be IdTokenOAuthVerifier), and the mock ignores it — so the flow is
 * exercisable now, and wiring the real SDK here is the only change to go live.
 */
export async function acquireIdToken(provider: OAuthProvider): Promise<string> {
  return buildDevIdToken(provider);
}

const ISSUERS: Record<OAuthProvider, string> = {
  google: 'https://accounts.google.com',
  apple: 'https://appleid.apple.com',
};

function buildDevIdToken(provider: OAuthProvider): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    iss: ISSUERS[provider],
    sub: `dev-${provider}-user`,
    email: `dev.${provider}@users.noreply.zeyoo.app`,
    email_verified: true,
    iat: now,
    exp: now + 5 * 60,
  };
  return `${base64Url(header)}.${base64Url(payload)}.dev`;
}

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
