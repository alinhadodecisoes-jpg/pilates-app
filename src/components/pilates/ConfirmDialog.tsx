'use client';

import { Modal } from './Modal';

interface ConfirmDialogProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  title = 'Confirmar ação',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmText={confirmText}
      confirmVariant="danger"
      loading={loading}
    >
      <p className="text-slate-300">{message}</p>
    </Modal>
  );
}
