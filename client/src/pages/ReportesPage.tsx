import { useState, useEffect, useCallback } from 'react';
import { Package, Truck, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { Pedido } from '@/types';
import { TIPO_CLIENTE_LABELS, PEDIDO_ESTADO_LABELS, tipoClienteColor } from '@/types';
import { formatDate } from '@/lib/formatters';

interface Stats {
  totalPedidos: number;
  pedidosHoy: number;
  entregados: number;
  pendientes: number;
  enCamino: number;
  grandes: number;
  porTipoCliente: { hotel: number; restaurante: number; regular: number };
  porEstado: Record<string, number>;
}

function calcStats(pedidos: Pedido[]): Stats {
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    totalPedidos: pedidos.length,
    pedidosHoy: pedidos.filter((p) => p.createdAt.slice(0, 10) === hoy).length,
    entregados: pedidos.filter((p) => p.estado === 'entregado').length,
    pendientes: pedidos.filter((p) => p.estado === 'pendiente').length,
    enCamino: pedidos.filter((p) => p.estado === 'enCamino').length,
    grandes: pedidos.filter((p) => p.esGrande).length,
    porTipoCliente: {
      hotel: pedidos.filter((p) => p.tipoCliente === 'hotel').length,
      restaurante: pedidos.filter((p) => p.tipoCliente === 'restaurante').length,
      regular: pedidos.filter((p) => p.tipoCliente === 'regular').length,
    },
    porEstado: pedidos.reduce((acc, p) => {
      acc[p.estado] = (acc[p.estado] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

function StatCard({ label, value, icon: Icon, color = 'text-primary', bg = 'bg-primary-light' }: {
  label: string; value: number; icon: typeof Package; color?: string; bg?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-card p-4 flex items-start gap-3">
      <div className={`p-2 rounded-md flex-shrink-0 ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function ReportesPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Pedido[]>('/pedidos');
      setPedidos(data);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPedidos(); }, [loadPedidos]);

  const filtered = pedidos.filter((p) => {
    const fecha = new Date(p.createdAt);
    const now = new Date();
    if (period === 'today') {
      return p.createdAt.slice(0, 10) === now.toISOString().slice(0, 10);
    }
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return fecha >= weekAgo;
    }
    if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return fecha >= monthAgo;
    }
    return true;
  });

  const stats = calcStats(filtered);

  const recentPedidos = filtered
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-base font-semibold text-text-primary">Reportes</h1>
        <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-md p-1">
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded transition-colors ${period === p ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {p === 'today' ? 'Hoy' : p === 'week' ? '7 días' : p === 'month' ? '30 días' : 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-text-disabled">Cargando datos...</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label="Total pedidos" value={stats.totalPedidos} icon={Package} />
            <StatCard label="Pedidos hoy" value={stats.pedidosHoy} icon={Clock} color="text-accent" bg="bg-accent-light" />
            <StatCard label="Entregados" value={stats.entregados} icon={CheckCircle} color="text-disponible" bg="bg-primary-light" />
            <StatCard label="Pendientes" value={stats.pendientes} icon={TrendingUp} color="text-yellow-600" bg="bg-yellow-50" />
            <StatCard label="En camino" value={stats.enCamino} icon={Truck} color="text-accent" bg="bg-accent-light" />
            <StatCard label="Grandes" value={stats.grandes} icon={Package} color="text-purple-600" bg="bg-purple-50" />
          </div>

          {/* Distribución por tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-card p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Por tipo de cliente
              </h2>
              <div className="flex flex-col gap-2">
                {(['hotel', 'restaurante', 'regular'] as const).map((tipo) => {
                  const count = stats.porTipoCliente[tipo];
                  const pct = stats.totalPedidos > 0 ? Math.round((count / stats.totalPedidos) * 100) : 0;
                  return (
                    <div key={tipo} className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full w-20 text-center ${tipoClienteColor(tipo)}`}>
                        {TIPO_CLIENTE_LABELS[tipo]}
                      </span>
                      <div className="flex-1 bg-surface-2 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${tipo === 'regular' ? 'bg-primary' : 'bg-accent'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-text-primary w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-card p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Por estado
              </h2>
              <div className="flex flex-col gap-2">
                {Object.entries(PEDIDO_ESTADO_LABELS).map(([estado, label]) => {
                  const count = stats.porEstado[estado] ?? 0;
                  const pct = stats.totalPedidos > 0 ? Math.round((count / stats.totalPedidos) * 100) : 0;
                  return (
                    <div key={estado} className="flex items-center gap-3">
                      <span className="text-[10px] text-text-secondary w-24 truncate">{label}</span>
                      <div className="flex-1 bg-surface-2 rounded-full h-2">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-text-primary w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Últimos pedidos */}
          <div className="bg-surface border border-border rounded-card">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Pedidos recientes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-2">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Pedido</th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Cliente</th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Tipo</th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Fecha</th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPedidos.map((pedido) => (
                    <tr key={pedido.id} className="border-b border-border last:border-b-0 hover:bg-surface-2">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-text-secondary">{pedido.numeroPedido}</span>
                          {pedido.esGrande && <span className="text-[9px] bg-accent-light text-accent px-1 py-0.5 rounded">GRANDE</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-text-primary">{pedido.nombreCliente}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tipoClienteColor(pedido.tipoCliente)}`}>
                          {TIPO_CLIENTE_LABELS[pedido.tipoCliente]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{formatDate(pedido.fechaSolicitada)}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{PEDIDO_ESTADO_LABELS[pedido.estado]}</td>
                    </tr>
                  ))}
                  {recentPedidos.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-text-disabled">Sin pedidos en este período</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
