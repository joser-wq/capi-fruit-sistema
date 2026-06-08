import { useState, useMemo, useCallback, useEffect } from 'react';
import { addDays, startOfWeek, format } from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { Ticket, Pedido, TicketType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import DayColumn from './board/DayColumn';
import PedidoTray from './board/PedidoTray';
import TicketTypePicker from './board/TicketTypePicker';
import CreateTicketModal from './board/CreateTicketModal';
import CreateMantenimientoModal from './board/CreateMantenimientoModal';
import EditTicketModal from './board/EditTicketModal';

type ModalState =
  | { type: 'none' }
  | { type: 'typePicker'; day: string }
  | { type: 'createRuta'; day: string }
  | { type: 'createMantenimiento'; day: string }
  | { type: 'edit'; ticket: Ticket };

export default function BoardPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const isRepartidor = user?.rol === 'repartidor';

  const [weekOffset, setWeekOffset] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Semana actual
  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd')),
    [weekStart]
  );

  const today = format(new Date(), 'yyyy-MM-dd');

  // Cargar tickets
  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const semana = format(weekStart, 'yyyy-MM-dd');
      const data = await api.get<Ticket[]>(`/tickets?semana=${semana}`);
      setTickets(data);
    } catch {
      showToast('Error al cargar tickets', 'error');
    } finally {
      setLoadingTickets(false);
    }
  }, [weekStart]);

  // Cargar pedidos pendientes (solo admin)
  const loadPedidos = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingPedidos(true);
    try {
      const data = await api.get<Pedido[]>('/pedidos?estado=pendiente');
      setPedidos(data);
    } catch {
      setPedidos([]);
    } finally {
      setLoadingPedidos(false);
    }
  }, [isAdmin]);

  useEffect(() => { void loadTickets(); }, [loadTickets]);
  useEffect(() => { void loadPedidos(); }, [loadPedidos]);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
  }

  function handleAddTicket(day: string) {
    setModal({ type: 'typePicker', day });
  }

  function handleTicketClick(ticket: Ticket) {
    // Repartidores solo ven, no editan
    if (isRepartidor) return;
    setModal({ type: 'edit', ticket });
  }

  function handleTypeSelect(tipo: TicketType) {
    if (modal.type !== 'typePicker') return;
    const day = modal.day;
    if (tipo === 'ruta') setModal({ type: 'createRuta', day });
    else setModal({ type: 'createMantenimiento', day });
  }

  function handleCreated() {
    setModal({ type: 'none' });
    showToast('Ticket creado');
    void loadTickets();
    void loadPedidos();
  }

  function handleSaved() {
    setModal({ type: 'none' });
    showToast('Ticket actualizado');
    void loadTickets();
    void loadPedidos();
  }

  function handleDeleted() {
    setModal({ type: 'none' });
    showToast('Ticket eliminado');
    void loadTickets();
    void loadPedidos();
  }

  const weekLabel = `${format(weekStart, 'd MMM')} – ${format(addDays(weekStart, 6), 'd MMM yyyy')}`;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <h1 className="text-sm font-semibold text-text-primary">
          {isRepartidor ? 'Mis entregas' : 'Tablero de rutas'}
        </h1>

        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-1.5 rounded-md hover:bg-surface-2 text-text-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="px-2.5 py-1 text-xs rounded-md hover:bg-surface-2 text-text-secondary font-medium min-w-[130px] text-center"
          >
            {weekLabel}
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-1.5 rounded-md hover:bg-surface-2 text-text-secondary"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => { void loadTickets(); void loadPedidos(); }}
          disabled={loadingTickets}
          className="ml-auto p-1.5 rounded-md hover:bg-surface-2 text-text-secondary disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Board + Tray */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Tablero semanal */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full min-w-[700px]">
            {weekDays.map((day) => (
              <DayColumn
                key={day}
                day={day}
                tickets={tickets}
                isToday={day === today}
                isAdmin={isAdmin}
                onAddTicket={handleAddTicket}
                onTicketClick={handleTicketClick}
              />
            ))}
          </div>
        </div>

        {/* Bandeja de pedidos pendientes (solo admin) */}
        {isAdmin && (
          <PedidoTray pedidos={pedidos} loading={loadingPedidos} />
        )}
      </div>

      {/* Modales */}
      {modal.type === 'typePicker' && (
        <TicketTypePicker
          onSelect={handleTypeSelect}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
      {modal.type === 'createRuta' && (
        <CreateTicketModal
          initialDate={modal.day}
          onClose={() => setModal({ type: 'none' })}
          onCreated={handleCreated}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}
      {modal.type === 'createMantenimiento' && (
        <CreateMantenimientoModal
          initialDate={modal.day}
          onClose={() => setModal({ type: 'none' })}
          onCreated={handleCreated}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}
      {modal.type === 'edit' && (
        <EditTicketModal
          ticket={modal.ticket}
          onClose={() => setModal({ type: 'none' })}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
