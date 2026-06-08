import { ShoppingBag, Package } from 'lucide-react';
import type { Pedido } from '@/types';
import { TIPO_CLIENTE_LABELS, PEDIDO_ESTADO_LABELS, tipoClienteColor } from '@/types';
import { formatDate } from '@/lib/formatters';

interface Props {
  pedidos: Pedido[];
  loading: boolean;
}

export default function PedidoTray({ pedidos, loading }: Props) {
  const pendientes = pedidos.filter((p) => p.estado === 'pendiente' || p.estado === 'aceptado');

  return (
    <aside className="w-64 flex-shrink-0 bg-surface border-l border-border flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-text-primary">Pedidos sin ruta</span>
        <span className="ml-auto text-xs bg-accent text-white px-1.5 py-0.5 rounded-full font-medium">
          {pendientes.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {loading && (
          <p className="text-xs text-text-disabled text-center py-4">Cargando...</p>
        )}

        {!loading && pendientes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <Package className="w-8 h-8 text-text-disabled" />
            <p className="text-xs text-text-disabled">No hay pedidos pendientes de asignar</p>
          </div>
        )}

        {pendientes.map((pedido) => (
          <div
            key={pedido.id}
            className="bg-surface-2 border border-border rounded-card p-2.5 hover:border-border-strong transition-colors"
          >
            <div className="flex items-start gap-1.5 mb-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-mono text-text-disabled">{pedido.numeroPedido}</span>
                  {pedido.esGrande && (
                    <span className="text-[9px] bg-accent-light text-accent px-1 py-0.5 rounded font-medium">GRANDE</span>
                  )}
                  {pedido.origenWeb && (
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded">WEB</span>
                  )}
                </div>
                <p className="text-xs font-medium text-text-primary truncate mt-0.5">
                  {pedido.nombreCliente}
                </p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${tipoClienteColor(pedido.tipoCliente)}`}>
                {TIPO_CLIENTE_LABELS[pedido.tipoCliente]}
              </span>
            </div>

            <p className="text-[10px] text-text-disabled truncate mb-1">
              {pedido.direccionEntrega}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-disabled">
                {formatDate(pedido.fechaSolicitada)}
              </span>
              <span className="text-[9px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full">
                {PEDIDO_ESTADO_LABELS[pedido.estado]}
              </span>
            </div>

            {/* Productos resumidos */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {pedido.productos.slice(0, 3).map((prod, i) => (
                <span key={i} className="text-[9px] bg-surface border border-border px-1.5 py-0.5 rounded text-text-secondary">
                  {prod.nombre} {prod.cantidad}{prod.unidad}
                </span>
              ))}
              {pedido.productos.length > 3 && (
                <span className="text-[9px] text-text-disabled">+{pedido.productos.length - 3} más</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
