'use client';

import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` colours the confirm button for destructive or high-consequence actions. */
  tone?: 'primary' | 'danger';
}

interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmOptions;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * The presentational half of the confirm flow. State and promise wiring live in
 * {@link ConfirmProvider}; screens never render this directly — they call `useConfirm`.
 */
export function ConfirmDialog({ open, options, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={options.title}>
      {options.message ? <p className="text-sm text-text-muted">{options.message}</p> : null}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {options.cancelLabel ?? 'Cancel'}
        </Button>
        <Button variant={options.tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
          {options.confirmLabel ?? 'Confirm'}
        </Button>
      </div>
    </Modal>
  );
}
