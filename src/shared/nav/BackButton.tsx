'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

/** The back affordance every pushed screen leads with; falls back to history. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={onPress ?? (() => router.back())}
      aria-label="Go back"
      className="-ms-3 inline-flex items-center gap-1 rounded-lg p-1 text-text-muted transition-colors hover:text-text"
    >
      <ChevronLeft className="size-6" aria-hidden />
      <span className="text-[15px] font-medium">Back</span>
    </button>
  );
}
