import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import type { Ticket } from '@/types';
import { ticketCoversDay } from '@/types';
import TicketCard from './TicketCard';

interface Props {
  day: string; // ISO date string YYYY-MM-DD
  tickets: Ticket[];
  isToday: boolean;
  isAdmin: boolean;
  onAddTicket: (day: string) => void;
  onTicketClick: (ticket: Ticket) => void;
}

export default function DayColumn({ day, tickets, isToday, isAdmin, onAddTicket, onTicketClick }: Props) {
  const dayTickets = tickets.filter((t) => ticketCoversDay(t, day));
  const dateObj = parseISO(day);
  const dayName = format(dateObj, 'EEEE', { locale: es });
  const dayNum = format(dateObj, 'd MMM', { locale: es });

  return (
    <div className={`flex-1 min-w-[160px] flex flex-col border-r border-border last:border-r-0 ${isToday ? 'bg-primary-light/30' : ''}`}>
      {/* Header del día */}
      <div className={`px-2 py-2.5 border-b border-border flex items-center justify-between sticky top-0 z-10 ${isToday ? 'bg-primary-light/60' : 'bg-surface'}`}>
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'text-primary' : 'text-text-disabled'}`}>
            {dayName}
          </p>
          <p className={`text-xs font-medium capitalize ${isToday ? 'text-primary' : 'text-text-primary'}`}>
            {dayNum}
          </p>
        </div>
        {isToday && (
          <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-medium">HOY</span>
        )}
      </div>

      {/* Tickets del día */}
      <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto min-h-0">
        {dayTickets.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            onClick={() => onTicketClick(t)}
            isAdmin={isAdmin}
          />
        ))}

        {/* Botón agregar (solo admin) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => onAddTicket(day)}
            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md border border-dashed border-border text-text-disabled hover:border-primary hover:text-primary hover:bg-primary-light/40 transition-colors text-xs w-full"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        )}
      </div>
    </div>
  );
}
