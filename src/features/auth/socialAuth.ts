import type { OAuthProvider } from '@/shared/api';

/**
 * Obtains a provider ID token to exchange with the backend.
 *
 * Provider SDK wiring is intentionally required here: fabricated development
 * tokens must never reach the real authentication backend.
 */
export async function acquireIdToken(provider: OAuthProvider): Promise<string> {
  throw new Error(`${provider === 'apple' ? 'Apple' : 'Google'} sign-in is not configured yet.`);
}
