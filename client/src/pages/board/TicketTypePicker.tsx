import { Truck, Wrench } from 'lucide-react';
import type { TicketType } from '@/types';

interface Props {
  onSelect: (tipo: TicketType) => void;
  onClose: () => void;
}

const TYPES = [
  { tipo: 'ruta' as TicketType, label: 'Ruta de entrega', desc: 'Asignar pedidos a un repartidor', icon: Truck, color: 'text-accent', bg: 'bg-accent-light' },
  { tipo: 'mantenimiento' as TicketType, label: 'Mantenimiento', desc: 'Vehículo fuera de servicio o tarea interna', icon: Wrench, color: 'text-text-secondary', bg: 'bg-surface-2' },
];

export default function TicketTypePicker({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-container w-full max-w-xs shadow-container">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-text-primary">Nuevo ticket</h2>
          <p className="text-xs text-text-secondary mt-0.5">¿Qué tipo de ticket querés crear?</p>
        </div>
        <div className="px-3 pb-4 flex flex-col gap-2">
          {TYPES.map(({ tipo, label, desc, icon: Icon, color, bg }) => (
            <button
              key={tipo}
              type="button"
              onClick={() => onSelect(tipo)}
              className="flex items-start gap-3 px-3 py-3 rounded-md border border-border hover:border-border-strong hover:bg-surface-2 transition-colors text-left"
            >
              <div className={`p-2 rounded-md flex-shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
