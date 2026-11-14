import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const buttonStyle = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40',
    primary: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/40',
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="md">
      <div className="flex items-start gap-4 py-2">
        <div
          className={`shrink-0 rounded-xl p-3 border ${
            variant === 'danger'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : variant === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-teal-500/10 border-teal-500/30 text-teal-400'
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-lg disabled:opacity-50 ${buttonStyle}`}
        >
          {isLoading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
