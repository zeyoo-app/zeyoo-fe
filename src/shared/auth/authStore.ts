'use client';

import { create } from 'zustand';

import type { Session } from '../api/types';
import { clearBackendSession } from '../api/backendApi';
let clearQueries: (() => void) | null = null;

export function registerAuthQueryCleanup(cleanup: () => void): () => void {
  clearQueries = cleanup;
  return () => { if (clearQueries === cleanup) clearQueries = null; };
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  hydrate: () => void;
  signIn: (session: Session) => void;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = 'zeyoo.session';

/**
 * Session state for the whole web app. Mirrors the mobile auth store: the session
 * marker drives route guards; access tokens stay in memory and the rotating
 * refresh token is held by the BFF in an httpOnly cookie.
 */
function readStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null): void {
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // A blocked/absent storage must not break auth; the in-memory copy still drives the app.
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,

  hydrate: () => {
    const session = readStoredSession();
    set({ status: session ? 'authenticated' : 'unauthenticated', session });
  },

  signIn: (session) => {
    clearQueries?.();
    writeStoredSession(session);
    set({ status: 'authenticated', session });
  },

  signOut: async () => {
    clearQueries?.();
    await clearBackendSession().catch(() => undefined);
    writeStoredSession(null);
    set({ status: 'unauthenticated', session: null });
  },
}));
