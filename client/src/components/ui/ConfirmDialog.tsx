import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', confirmVariant = 'danger', loading = false }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-container w-full max-w-sm shadow-container">
        <div className="px-6 pt-7 pb-5 flex flex-col items-center gap-3 text-center">
          <div className="w-11 h-11 rounded-full bg-saturado-light flex items-center justify-center flex-shrink-0">
            <span className="text-saturado text-lg font-bold leading-none">!</span>
          </div>
          <h2 className="text-sm font-medium text-text-primary">{title}</h2>
          <p className="text-xs text-text-secondary leading-relaxed max-w-[260px]">{message}</p>
        </div>
        <div className="px-6 py-4 border-t border-border bg-surface-2 rounded-b-container flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
