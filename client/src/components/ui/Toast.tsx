import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-surface border border-border rounded-container shadow-container px-4 py-3 min-w-[260px] max-w-sm">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${type === 'success' ? 'bg-disponible' : 'bg-saturado'}`} />
      <p className="text-sm text-text-primary">{message}</p>
      <button type="button" onClick={onClose} className="ml-auto text-text-disabled hover:text-text-secondary text-xs leading-none">✕</button>
    </div>
  );
}
