// ── Enumeraciones ──────────────────────────────────────────────────────────
export type TipoCliente = 'hotel' | 'restaurante' | 'regular';
export type PedidoEstado = 'pendiente' | 'aceptado' | 'enPreparacion' | 'enCamino' | 'entregado';
export type TicketType = 'ruta' | 'mantenimiento';
export type TicketState = 'borrador' | 'asignado' | 'enRuta' | 'completado';

// ── Usuario ────────────────────────────────────────────────────────────────
export interface AppUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

export const ROL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  repartidor: 'Repartidor',
  gerencia: 'Gerencia',
};

// ── Producto dentro de un pedido ──────────────────────────────────────────
export interface ProductoPedido {
  nombre: string;
  cantidad: number;
  unidad: string;    // 'kg' | 'unidad' | 'caja' | 'bolsa' | etc.
  pesoKg?: number;   // peso total de este ítem en kg (cantidad × peso_unitario)
}

// ── Pedido ─────────────────────────────────────────────────────────────────
export interface Pedido {
  id: number;
  numeroPedido: string;          // CF-2026-0001
  nombreCliente: string;
  tipoCliente: TipoCliente;
  productos: ProductoPedido[];
  pesoTotal: number | null;      // suma de pesoKg de todos los productos
  numProductosTipo: number;      // cantidad de tipos distintos de producto
  esGrande: boolean;             // auto: >5 kg O ≥3 tipos distintos
  direccionEntrega: string;
  telefono: string | null;
  fechaSolicitada: string;       // ISO date
  estado: PedidoEstado;
  notas: string | null;
  createdById: number | null;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
  ticketPedidos?: TicketPedidoRef[];
}

export interface TicketPedidoRef {
  id: number;
  ticketId: number;
  orden: number;
  active: boolean;
  ticket: {
    id: number;
    codigo: string;
    tipo: TicketType;
    fecha: string;
    estado: TicketState;
    repartidor: { nombre: string } | null;
  };
}

// ── Ticket de ruta / mantenimiento ─────────────────────────────────────────
export interface TicketPedidoEntry {
  id: number;
  ticketId: number;
  pedidoId: number;
  orden: number;
  active: boolean;
  pedido: {
    id: number;
    numeroPedido: string;
    nombreCliente: string;
    tipoCliente: TipoCliente;
    direccionEntrega: string;
    estado: PedidoEstado;
    esGrande: boolean;
    fechaSolicitada: string;
    productos: ProductoPedido[];
    pesoTotal: number | null;
    numProductosTipo: number;
  };
}

export interface Ticket {
  id: number;
  codigo: string;
  tipo: TicketType;
  fecha: string;
  fechaFin: string | null;
  descripcion: string | null;
  repartidorId: number | null;
  horaSalida: string | null;
  notas: string | null;
  estado: TicketState;
  orden: number;
  createdAt: string;
  updatedAt: string;
  repartidor: { id: number; nombre: string } | null;
  ticketPedidos: TicketPedidoEntry[];
}

// ── Repartidor ─────────────────────────────────────────────────────────────
export interface Repartidor {
  id: number;
  nombre: string;
  activo: boolean;
}

// ── Labels y utilidades ────────────────────────────────────────────────────
export const TIPO_CLIENTE_LABELS: Record<TipoCliente, string> = {
  hotel: 'Hotel',
  restaurante: 'Restaurante',
  regular: 'Cliente regular',
};

export const PEDIDO_ESTADO_LABELS: Record<PedidoEstado, string> = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  enPreparacion: 'En preparación',
  enCamino: 'En camino',
  entregado: 'Entregado',
};

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  ruta: 'Ruta de entrega',
  mantenimiento: 'Mantenimiento',
};

export const TICKET_STATE_LABELS: Record<TicketState, string> = {
  borrador: 'Borrador',
  asignado: 'Asignado',
  enRuta: 'En ruta',
  completado: 'Completado',
};

// ── Helpers de color por tipo de cliente ──────────────────────────────────
export function tipoClienteColor(tipo: TipoCliente): string {
  if (tipo === 'regular') return 'bg-primary-light text-primary';
  return 'bg-accent-light text-accent';
}

// ── Helper: ¿el pedido es "grande"? ───────────────────────────────────────
export function calcularEsGrande(productos: ProductoPedido[]): boolean {
  const pesoTotal = productos.reduce((s, p) => s + (p.pesoKg ?? 0), 0);
  const tiposDistintos = productos.length;
  return pesoTotal > 5 || tiposDistintos >= 3;
}

// ── Ocupación de tickets en el tablero ────────────────────────────────────
export function ticketCoversDay(t: Ticket, day: string): boolean {
  const start = t.fecha.slice(0, 10);
  const rawEnd = (t.fechaFin ?? t.fecha).slice(0, 10);
  const end = rawEnd < start ? start : rawEnd;
  return day >= start && day <= end;
}

export function isRepartidorBusyOnDay(t: Ticket, day: string): boolean {
  if (t.repartidorId == null) return false;
  const start = t.fecha.slice(0, 10);
  const end = (t.fechaFin ?? t.fecha).slice(0, 10);
  if (t.tipo === 'mantenimiento') return day === start || day === end;
  return day >= start && day <= end;
}
