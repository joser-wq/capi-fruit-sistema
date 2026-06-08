import { Package, Truck, Wrench, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Ticket } from '@/types';
import { TICKET_STATE_LABELS, TICKET_TYPE_LABELS, PEDIDO_ESTADO_LABELS, tipoClienteColor, TIPO_CLIENTE_LABELS } from '@/types';
import { formatDate } from '@/lib/formatters';

interface Props {
  ticket: Ticket;
  onClick: () => void;
  isAdmin: boolean;
}

const estadoColors: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  asignado: 'bg-blue-50 text-blue-700',
  enRuta: 'bg-accent-light text-accent',
  completado: 'bg-primary-light text-primary',
};

const pedidoEstadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-50 text-yellow-700',
  aceptado: 'bg-blue-50 text-blue-700',
  enPreparacion: 'bg-purple-50 text-purple-700',
  enCamino: 'bg-accent-light text-accent',
  entregado: 'bg-primary-light text-primary',
};

export default function TicketCard({ ticket, onClick, isAdmin }: Props) {
  const [expanded, setExpanded] = useState(false);
  const pedidos = ticket.ticketPedidos.filter((tp) => tp.active);
  const isRuta = ticket.tipo === 'ruta';

  return (
    <div
      className="bg-surface border border-border rounded-card shadow-card hover:border-border-strong transition-all duration-150 cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="px-3 py-2.5 flex items-start gap-2">
        <div className={`mt-0.5 flex-shrink-0 p-1 rounded-md ${isRuta ? 'bg-accent-light' : 'bg-surface-2'}`}>
          {isRuta
            ? <Truck className="w-3.5 h-3.5 text-accent" />
            : <Wrench className="w-3.5 h-3.5 text-text-disabled" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-text-disabled">{ticket.codigo}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${estadoColors[ticket.estado] ?? 'bg-gray-100 text-gray-600'}`}>
              {TICKET_STATE_LABELS[ticket.estado]}
            </span>
          </div>

          <p className="text-xs font-medium text-text-primary mt-0.5">
            {TICKET_TYPE_LABELS[ticket.tipo]}
          </p>

          {ticket.repartidor && (
            <p className="text-[11px] text-text-secondary mt-0.5 truncate">
              {ticket.repartidor.nombre}
            </p>
          )}
        </div>

        {isAdmin && isRuta && pedidos.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="flex-shrink-0 p-0.5 rounded hover:bg-surface-2 text-text-disabled"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Info rápida */}
      <div className="px-3 pb-2.5 flex items-center gap-3 flex-wrap">
        {ticket.horaSalida && (
          <div className="flex items-center gap-1 text-[10px] text-text-disabled">
            <Clock className="w-3 h-3" />
            <span>{ticket.horaSalida}</span>
          </div>
        )}
        {isRuta && (
          <div className="flex items-center gap-1 text-[10px] text-text-disabled">
            <Package className="w-3 h-3" />
            <span>{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {ticket.fechaFin && (
          <span className="text-[10px] text-text-disabled">
            hasta {formatDate(ticket.fechaFin)}
          </span>
        )}
      </div>

      {/* Lista de pedidos expandida */}
      {expanded && pedidos.length > 0 && (
        <div className="border-t border-border px-3 py-2 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
          {pedidos.map((tp) => (
            <div key={tp.id} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-medium text-text-primary truncate">
                    {tp.pedido.nombreCliente}
                  </span>
                  {tp.pedido.esGrande && (
                    <span className="text-[9px] bg-accent-light text-accent px-1 py-0.5 rounded font-medium">GRANDE</span>
                  )}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tipoClienteColor(tp.pedido.tipoCliente)}`}>
                    {TIPO_CLIENTE_LABELS[tp.pedido.tipoCliente]}
                  </span>
                </div>
                <p className="text-[10px] text-text-disabled truncate">{tp.pedido.direccionEntrega}</p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${pedidoEstadoColors[tp.pedido.estado] ?? ''}`}>
                {PEDIDO_ESTADO_LABELS[tp.pedido.estado]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
