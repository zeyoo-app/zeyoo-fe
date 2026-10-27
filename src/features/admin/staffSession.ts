'use client';

import { create } from 'zustand';

import { STAFF_SESSION_CHANNEL, clearBackendSession } from '@/shared/api';
import type { StaffSession } from '@/shared/api';

type StaffSessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface StaffSessionState {
  status: StaffSessionStatus;
  staff: StaffSession | null;
  hydrate: () => void;
  signIn: (staff: StaffSession) => void;
  signOut: () => void;
}

const STORAGE_KEY = 'zeyoo.staff-session';

/**
 * The back-office session, kept apart from the app's own: a staff member can be
 * signed in here and as a creator or brand at the same time. Like the app store, it
 * only holds a marker for route guards; tokens stay in memory and an httpOnly cookie.
 */
function readStored(): StaffSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StaffSession) : null;
  } catch {
    return null;
  }
}

function writeStored(staff: StaffSession | null): void {
  try {
    if (staff) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // A blocked/absent storage must not break sign-in; the in-memory copy still drives the console.
  }
}

export const useStaffSession = create<StaffSessionState>((set) => ({
  status: 'loading',
  staff: null,

  hydrate: () => {
    const staff = readStored();
    set({ status: staff ? 'authenticated' : 'unauthenticated', staff });
  },

  signIn: (staff) => {
    writeStored(staff);
    set({ status: 'authenticated', staff });
  },

  signOut: () => {
    void clearBackendSession(STAFF_SESSION_CHANNEL);
    writeStored(null);
    set({ status: 'unauthenticated', staff: null });
  },
}));
