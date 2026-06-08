import { useState, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface Props {
  initialDate: string;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}

export default function CreateMantenimientoModal({ initialDate, onClose, onCreated, onError }: Props) {
  const [form, setForm] = useState({
    fecha: initialDate,
    fechaFin: initialDate,
    descripcion: '',
    notas: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tickets', {
        tipo: 'mantenimiento',
        fecha: form.fecha,
        fechaFin: form.fechaFin || null,
        descripcion: form.descripcion || null,
        notas: form.notas || null,
      });
      onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al crear ticket');
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-container w-full max-w-sm shadow-container">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Mantenimiento</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-surface-2 text-text-disabled"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Fecha inicio *</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Fecha fin</label>
                <input
                  type="date"
                  value={form.fechaFin}
                  min={form.fecha}
                  onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Descripción *</label>
              <input
                type="text"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Ej: Cambio de aceite camioneta"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Notas</label>
              <textarea
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-border bg-surface-2 flex justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" loading={loading}>Crear</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
