import { useState, useEffect, useCallback, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, X, Package, RefreshCw, Trash2 } from 'lucide-react';
import type { Pedido, TipoCliente, PedidoEstado, ProductoPedido } from '@/types';
import {
  TIPO_CLIENTE_LABELS,
  PEDIDO_ESTADO_LABELS,
  tipoClienteColor,
  calcularEsGrande,
} from '@/types';
import { api } from '@/lib/api';
import { formatDate, toDateInput } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// ── Colores de estado ──────────────────────────────────────────────────────
const estadoColors: Record<PedidoEstado, string> = {
  pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  aceptado: 'bg-blue-50 text-blue-700 border-blue-200',
  enPreparacion: 'bg-purple-50 text-purple-700 border-purple-200',
  enCamino: 'bg-accent-light text-accent border-orange-200',
  entregado: 'bg-primary-light text-primary border-green-200',
};

// ── Modal de creación / edición ────────────────────────────────────────────
interface PedidoFormData {
  nombreCliente: string;
  tipoCliente: TipoCliente;
  direccionEntrega: string;
  telefono: string;
  fechaSolicitada: string;
  notas: string;
  productos: ProductoPedido[];
}

const emptyForm: PedidoFormData = {
  nombreCliente: '',
  tipoCliente: 'regular',
  direccionEntrega: '',
  telefono: '',
  fechaSolicitada: new Date().toISOString().slice(0, 10),
  notas: '',
  productos: [{ nombre: '', cantidad: 1, unidad: 'kg', pesoKg: 0 }],
};

interface PedidoModalProps {
  pedido: Pedido | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}

function PedidoModal({ pedido, onClose, onSaved, onError }: PedidoModalProps) {
  const [form, setForm] = useState<PedidoFormData>(
    pedido
      ? {
          nombreCliente: pedido.nombreCliente,
          tipoCliente: pedido.tipoCliente,
          direccionEntrega: pedido.direccionEntrega,
          telefono: pedido.telefono ?? '',
          fechaSolicitada: toDateInput(pedido.fechaSolicitada),
          notas: pedido.notas ?? '',
          productos: pedido.productos.length > 0 ? pedido.productos : emptyForm.productos,
        }
      : { ...emptyForm }
  );
  const [loading, setLoading] = useState(false);
  const esGrande = calcularEsGrande(form.productos);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function setProducto(i: number, field: keyof ProductoPedido, value: string | number) {
    setForm((f) => {
      const prods = [...f.productos];
      prods[i] = { ...prods[i]!, [field]: value };
      return { ...f, productos: prods };
    });
  }

  function addProducto() {
    setForm((f) => ({ ...f, productos: [...f.productos, { nombre: '', cantidad: 1, unidad: 'kg', pesoKg: 0 }] }));
  }

  function removeProducto(i: number) {
    setForm((f) => ({ ...f, productos: f.productos.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const valid = form.productos.every((p) => p.nombre.trim().length > 0);
    if (!valid) { onError('Todos los productos deben tener nombre'); return; }
    setLoading(true);
    try {
      const payload = {
        nombreCliente: form.nombreCliente,
        tipoCliente: form.tipoCliente,
        direccionEntrega: form.direccionEntrega,
        telefono: form.telefono || null,
        fechaSolicitada: form.fechaSolicitada,
        notas: form.notas || null,
        productos: form.productos.map((p) => ({
          nombre: p.nombre,
          cantidad: Number(p.cantidad),
          unidad: p.unidad,
          pesoKg: Number(p.pesoKg ?? 0),
        })),
      };
      if (pedido) {
        await api.patch(`/pedidos/${pedido.id}`, payload);
      } else {
        await api.post('/pedidos', payload);
      }
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-container w-full max-w-xl shadow-container max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              {pedido ? `Editar pedido ${pedido.numeroPedido}` : 'Nuevo pedido'}
            </h2>
            {esGrande && (
              <span className="text-[10px] text-accent font-medium">⚠ Pedido grande</span>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-surface-2 text-text-disabled">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
            {/* Cliente */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Nombre del cliente *</label>
                <input
                  type="text"
                  value={form.nombreCliente}
                  onChange={(e) => setForm((f) => ({ ...f, nombreCliente: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Tipo de cliente</label>
                <select
                  value={form.tipoCliente}
                  onChange={(e) => setForm((f) => ({ ...f, tipoCliente: e.target.value as TipoCliente }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {Object.entries(TIPO_CLIENTE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Dirección de entrega *</label>
                <input
                  type="text"
                  value={form.direccionEntrega}
                  onChange={(e) => setForm((f) => ({ ...f, direccionEntrega: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Fecha solicitada *</label>
                <input
                  type="date"
                  value={form.fechaSolicitada}
                  onChange={(e) => setForm((f) => ({ ...f, fechaSolicitada: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Productos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-text-secondary">Productos *</label>
                <button type="button" onClick={addProducto} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {form.productos.map((prod, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      {i === 0 && <p className="text-[10px] text-text-disabled mb-1">Producto</p>}
                      <input
                        type="text"
                        value={prod.nombre}
                        onChange={(e) => setProducto(i, 'nombre', e.target.value)}
                        placeholder="Piña"
                        className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <p className="text-[10px] text-text-disabled mb-1">Cantidad</p>}
                      <input
                        type="number"
                        value={prod.cantidad}
                        min={0.1}
                        step={0.1}
                        onChange={(e) => setProducto(i, 'cantidad', parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <p className="text-[10px] text-text-disabled mb-1">Unidad</p>}
                      <select
                        value={prod.unidad}
                        onChange={(e) => setProducto(i, 'unidad', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="kg">kg</option>
                        <option value="unidad">unidad</option>
                        <option value="caja">caja</option>
                        <option value="bolsa">bolsa</option>
                        <option value="malla">malla</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <p className="text-[10px] text-text-disabled mb-1">Peso total (kg)</p>}
                      <input
                        type="number"
                        value={prod.pesoKg ?? 0}
                        min={0}
                        step={0.1}
                        onChange={(e) => setProducto(i, 'pesoKg', parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {i === 0 && <div className="mb-1 h-3.5" />}
                      <button
                        type="button"
                        onClick={() => removeProducto(i)}
                        disabled={form.productos.length === 1}
                        className="p-1 rounded hover:bg-saturado-light hover:text-saturado text-text-disabled disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

          <div className="px-5 py-4 border-t border-border bg-surface-2 flex justify-between gap-3 flex-shrink-0">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" loading={loading}>{pedido ? 'Guardar cambios' : 'Crear pedido'}</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Página principal de pedidos ────────────────────────────────────────────
export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [modal, setModal] = useState<{ open: boolean; pedido: Pedido | null }>({ open: false, pedido: null });
  const [confirmDelete, setConfirmDelete] = useState<Pedido | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterEstado) params.set('estado', filterEstado);
      if (filterTipo) params.set('tipoCliente', filterTipo);
      const data = await api.get<Pedido[]>(`/pedidos?${params.toString()}`);
      setPedidos(data);
    } catch {
      showToast('Error al cargar pedidos', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterEstado, filterTipo]);

  useEffect(() => { void loadPedidos(); }, [loadPedidos]);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
  }

  async function handleChangeEstado(pedido: Pedido, estado: PedidoEstado) {
    try {
      await api.patch(`/pedidos/${pedido.id}`, { estado });
      showToast('Estado actualizado');
      void loadPedidos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/pedidos/${confirmDelete.id}`);
      setConfirmDelete(null);
      showToast('Pedido eliminado');
      void loadPedidos();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = pedidos.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.nombreCliente.toLowerCase().includes(q) ||
      p.numeroPedido.toLowerCase().includes(q) ||
      p.direccionEntrega.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-surface border-b border-border px-4 py-3 flex items-center gap-3 flex-wrap">
        <h1 className="text-sm font-semibold text-text-primary">Pedidos</h1>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-disabled" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-7 pr-3 py-1.5 text-xs border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
          />
        </div>

        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Todos los estados</option>
          {Object.entries(PEDIDO_ESTADO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_CLIENTE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void loadPedidos()}
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-surface-2 text-text-secondary disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <Button
          size="sm"
          className="ml-auto"
          onClick={() => setModal({ open: true, pedido: null })}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Nuevo pedido
        </Button>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {loading && pedidos.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-text-disabled">Cargando pedidos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Package className="w-10 h-10 text-text-disabled" />
            <p className="text-sm text-text-disabled">No hay pedidos</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-surface border-b border-border sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Pedido</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Cliente</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary hidden md:table-cell">Dirección</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary hidden lg:table-cell">Fecha</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary hidden lg:table-cell">Productos</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((pedido) => (
                <tr key={pedido.id} className="border-b border-border hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-text-secondary">{pedido.numeroPedido}</span>
                      {pedido.esGrande && (
                        <span className="text-[9px] bg-accent-light text-accent px-1.5 py-0.5 rounded font-medium">GRANDE</span>
                      )}
                      {pedido.origenWeb && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">WEB</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{pedido.nombreCliente}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tipoClienteColor(pedido.tipoCliente)}`}>
                      {TIPO_CLIENTE_LABELS[pedido.tipoCliente]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-text-secondary max-w-[200px] truncate">
                    {pedido.direccionEntrega}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-text-secondary">
                    {formatDate(pedido.fechaSolicitada)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {pedido.productos.slice(0, 2).map((p, i) => (
                        <span key={i} className="text-[9px] bg-surface-2 border border-border px-1.5 py-0.5 rounded text-text-secondary">
                          {p.nombre} {p.cantidad}{p.unidad}
                        </span>
                      ))}
                      {pedido.productos.length > 2 && (
                        <span className="text-[9px] text-text-disabled">+{pedido.productos.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={pedido.estado}
                      onChange={(e) => void handleChangeEstado(pedido, e.target.value as PedidoEstado)}
                      className={`text-[10px] px-2 py-1 rounded-full border font-medium focus:outline-none cursor-pointer ${estadoColors[pedido.estado]}`}
                    >
                      {Object.entries(PEDIDO_ESTADO_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, pedido })}
                        className="px-2.5 py-1 text-[10px] border border-border rounded-md hover:bg-surface-2 text-text-secondary"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(pedido)}
                        className="p-1.5 rounded-md hover:bg-saturado-light hover:text-saturado text-text-disabled"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Conteo */}
      <div className="flex-shrink-0 border-t border-border bg-surface px-4 py-2">
        <p className="text-xs text-text-disabled">{filtered.length} pedido{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Modal */}
      {modal.open && (
        <PedidoModal
          pedido={modal.pedido}
          onClose={() => setModal({ open: false, pedido: null })}
          onSaved={() => {
            setModal({ open: false, pedido: null });
            showToast(modal.pedido ? 'Pedido actualizado' : 'Pedido creado');
            void loadPedidos();
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar pedido"
        message={`¿Eliminás el pedido ${confirmDelete?.numeroPedido}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleting}
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
