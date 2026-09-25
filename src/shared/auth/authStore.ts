'use client';

import { create } from 'zustand';

import type { Session } from '../api/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  hydrate: () => void;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const STORAGE_KEY = 'zeyoo.session';

/**
 * Session state for the whole web app. Mirrors the mobile auth store: the session
 * marker drives route guards; the in-memory access token (real backend) is never
 * persisted in plaintext. On web the marker lives in localStorage for the mock;
 * the real build swaps this for the httpOnly-cookie BFF flow (IMPLEMENTATION_PLAN §7).
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
    writeStoredSession(session);
    set({ status: 'authenticated', session });
  },

  signOut: () => {
    writeStoredSession(null);
    set({ status: 'unauthenticated', session: null });
  },
}));
