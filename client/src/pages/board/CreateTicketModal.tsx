import { useState, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Repartidor } from '@/types';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface Props {
  initialDate: string;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
}

export default function CreateTicketModal({ initialDate, onClose, onCreated, onError }: Props) {
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [form, setForm] = useState({
    repartidorId: '',
    fecha: initialDate,
    fechaFin: '',
    horaSalida: '',
    descripcion: '',
    notas: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Repartidor[]>('/auth/users')
      .then((users) => setRepartidores(users.filter((u) => u.activo && (u as { rol: string }).rol === 'repartidor')))
      .catch(() => setRepartidores([]));
  }, []);

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
        tipo: 'ruta',
        fecha: form.fecha,
        fechaFin: form.fechaFin || null,
        repartidorId: form.repartidorId ? parseInt(form.repartidorId, 10) : null,
        horaSalida: form.horaSalida || null,
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
      <div className="relative bg-surface border border-border rounded-container w-full max-w-md shadow-container max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">Nueva ruta de entrega</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-surface-2 text-text-disabled"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Fecha de salida *</label>
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
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Repartidor</label>
              <select
                value={form.repartidorId}
                onChange={(e) => setForm((f) => ({ ...f, repartidorId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Sin asignar</option>
                {repartidores.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Hora de salida</label>
              <input
                type="time"
                value={form.horaSalida}
                onChange={(e) => setForm((f) => ({ ...f, horaSalida: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Descripción</label>
              <input
                type="text"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Ej: Zona norte, hoteles"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Notas internas</label>
              <textarea
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-border bg-surface-2 flex justify-between gap-3 flex-shrink-0">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" loading={loading}>Crear ruta</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
