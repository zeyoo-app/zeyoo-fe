'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useConfirm } from '@/design-system';
import { useApi } from '@/shared/api';
import { useAuthStore } from '@/shared/auth';

/**
 * Permanently deletes the signed-in account after an explicit confirmation, then
 * signs out. A refusal from the server (money or live campaigns outstanding) is
 * surfaced as `error` so the screen can explain what to do first.
 */
export function useDeleteAccount() {
  const api = useApi();
  const router = useRouter();
  const confirm = useConfirm();
  const signOut = useAuthStore((state) => state.signOut);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function requestDeletion() {
    setError(null);
    const confirmed = await confirm({
      title: 'Delete your account?',
      message: 'This permanently erases your profile and sign-in details. It cannot be undone.',
      confirmLabel: 'Delete account',
      tone: 'danger',
    });
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await api.deleteAccount();
      signOut();
      router.replace('/sign-in');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete your account.');
    } finally {
      setIsDeleting(false);
    }
  }

  return { requestDeletion, error, isDeleting };
}
