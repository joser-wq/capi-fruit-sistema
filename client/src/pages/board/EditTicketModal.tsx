import { useState, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import type { Ticket, Pedido, Repartidor } from '@/types';
import { TICKET_TYPE_LABELS, TICKET_STATE_LABELS, PEDIDO_ESTADO_LABELS, tipoClienteColor, TIPO_CLIENTE_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { api } from '@/lib/api';
import { formatDate, toDateInput } from '@/lib/formatters';

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onError: (msg: string) => void;
}

export default function EditTicketModal({ ticket, onClose, onSaved, onDeleted, onError }: Props) {
  const isRuta = ticket.tipo === 'ruta';
  const [tab, setTab] = useState<'info' | 'pedidos'>('info');
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);
  const [form, setForm] = useState({
    fecha: toDateInput(ticket.fecha),
    fechaFin: toDateInput(ticket.fechaFin),
    repartidorId: ticket.repartidorId?.toString() ?? '',
    horaSalida: ticket.horaSalida ?? '',
    descripcion: ticket.descripcion ?? '',
    notas: ticket.notas ?? '',
    estado: ticket.estado,
  });
  const [pedidoIds, setPedidoIds] = useState<number[]>(
    ticket.ticketPedidos.filter((tp) => tp.active).sort((a, b) => a.orden - b.orden).map((tp) => tp.pedidoId)
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<{ id: number; nombre: string; rol: string; activo: boolean }[]>('/auth/users')
      .then((users) => setRepartidores(users.filter((u) => u.activo && u.rol === 'repartidor')))
      .catch(() => {});

    if (isRuta) {
      api.get<Pedido[]>('/pedidos?estado=pendiente')
        .then((p) => setPedidosPendientes(p))
        .catch(() => {});
    }
  }, [isRuta]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/tickets/${ticket.id}`, {
        fecha: form.fecha,
        fechaFin: form.fechaFin || null,
        repartidorId: form.repartidorId ? parseInt(form.repartidorId, 10) : null,
        horaSalida: form.horaSalida || null,
        descripcion: form.descripcion || null,
        notas: form.notas || null,
        estado: form.estado,
        ...(isRuta ? { pedidoIds } : {}),
      });
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/tickets/${ticket.id}`);
      onDeleted();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  }

  function addPedido(pedidoId: number) {
    if (!pedidoIds.includes(pedidoId)) setPedidoIds((prev) => [...prev, pedidoId]);
  }

  function removePedido(pedidoId: number) {
    setPedidoIds((prev) => prev.filter((id) => id !== pedidoId));
  }

  const assignedMap = new Map(
    ticket.ticketPedidos.filter((tp) => tp.active).map((tp) => [tp.pedidoId, tp.pedido])
  );
  const extraPedidos = pedidosPendientes.filter((p) => !pedidoIds.includes(p.id));

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-surface border border-border rounded-container w-full max-w-lg shadow-container max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-text-disabled">{ticket.codigo}</span>
                <span className="text-[10px] bg-surface-2 border border-border px-1.5 py-0.5 rounded text-text-secondary">
                  {TICKET_TYPE_LABELS[ticket.tipo]}
                </span>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-surface-2 text-text-disabled flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs (solo para rutas) */}
          {isRuta && (
            <div className="flex border-b border-border flex-shrink-0">
              {(['info', 'pedidos'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-5 py-2.5 text-xs font-medium transition-colors ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  {t === 'info' ? 'Información' : `Pedidos (${pedidoIds.length})`}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {/* ── Tab Info ── */}
              {tab === 'info' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Fecha inicio</label>
                      <input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Fecha fin</label>
                      <input
                        type="date"
                        value={form.fechaFin}
                        onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>

                  {isRuta && (
                    <div className="grid grid-cols-2 gap-3">
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
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Hora salida</label>
                        <input
                          type="time"
                          value={form.horaSalida}
                          onChange={(e) => setForm((f) => ({ ...f, horaSalida: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Estado</label>
                    <select
                      value={form.estado}
                      onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as typeof form.estado }))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      {Object.entries(TICKET_STATE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Descripción</label>
                    <input
                      type="text"
                      value={form.descripcion}
                      onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Notas internas</label>
                    <textarea
                      value={form.notas}
                      onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ── Tab Pedidos ── */}
              {tab === 'pedidos' && isRuta && (
                <div className="flex flex-col gap-4">
                  {/* Pedidos asignados */}
                  <div>
                    <p className="text-xs font-medium text-text-secondary mb-2">Pedidos en esta ruta ({pedidoIds.length})</p>
                    {pedidoIds.length === 0 && (
                      <p className="text-xs text-text-disabled py-3 text-center border border-dashed border-border rounded-md">
                        No hay pedidos asignados
                      </p>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {pedidoIds.map((pid) => {
                        const pedido = assignedMap.get(pid) ?? pedidosPendientes.find((p) => p.id === pid);
                        if (!pedido) return null;
                        return (
                          <div key={pid} className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border rounded-md">
                            <GripVertical className="w-3.5 h-3.5 text-text-disabled flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-text-primary truncate">{'nombreCliente' in pedido ? pedido.nombreCliente : pedido.nombreCliente}</span>
                                {'esGrande' in pedido && pedido.esGrande && (
                                  <span className="text-[9px] bg-accent-light text-accent px-1 py-0.5 rounded">GRANDE</span>
                                )}
                                {'tipoCliente' in pedido && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tipoClienteColor(pedido.tipoCliente)}`}>
                                    {TIPO_CLIENTE_LABELS[pedido.tipoCliente]}
                                  </span>
                                )}
                              </div>
                              {'fechaSolicitada' in pedido && (
                                <p className="text-[10px] text-text-disabled truncate">{formatDate(pedido.fechaSolicitada)}</p>
                              )}
                            </div>
                            {'estado' in pedido && (
                              <span className="text-[9px] text-text-disabled flex-shrink-0">{PEDIDO_ESTADO_LABELS[pedido.estado]}</span>
                            )}
                            <button type="button" onClick={() => removePedido(pid)} className="p-1 rounded hover:bg-saturado-light hover:text-saturado text-text-disabled flex-shrink-0">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pedidos disponibles para agregar */}
                  {extraPedidos.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-2">Agregar pedidos pendientes</p>
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                        {extraPedidos.map((pedido) => (
                          <button
                            key={pedido.id}
                            type="button"
                            onClick={() => addPedido(pedido.id)}
                            className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-md hover:border-primary hover:bg-primary-light/40 transition-colors text-left"
                          >
                            <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-text-primary truncate">{pedido.nombreCliente}</span>
                                {pedido.esGrande && <span className="text-[9px] bg-accent-light text-accent px-1 py-0.5 rounded">GRANDE</span>}
                              </div>
                              <p className="text-[10px] text-text-disabled truncate">{pedido.direccionEntrega}</p>
                            </div>
                            <span className="text-[9px] text-text-disabled flex-shrink-0">{formatDate(pedido.fechaSolicitada)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border bg-surface-2 flex items-center gap-3 flex-shrink-0">
              <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                Eliminar
              </Button>
              <div className="flex-1" />
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
              <Button type="submit" loading={saving}>Guardar</Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar ticket"
        message={`¿Estás seguro de que querés eliminar el ticket ${ticket.codigo}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleting}
      />
    </>,
    document.body
  );
}
