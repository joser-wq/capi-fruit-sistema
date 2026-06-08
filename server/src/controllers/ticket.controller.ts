import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import type { CreateTicketInput, UpdateTicketInput } from '../schemas/ticket.schema';

// ── Selector estándar de ticket ────────────────────────────────────────────
const ticketSelect = {
  id: true,
  codigo: true,
  tipo: true,
  fecha: true,
  fechaFin: true,
  descripcion: true,
  repartidorId: true,
  horaSalida: true,
  notas: true,
  estado: true,
  orden: true,
  createdAt: true,
  updatedAt: true,
  repartidor: { select: { id: true, nombre: true } },
  ticketPedidos: {
    where: { active: true },
    include: {
      pedido: {
        select: {
          id: true,
          numeroPedido: true,
          nombreCliente: true,
          tipoCliente: true,
          direccionEntrega: true,
          estado: true,
          esGrande: true,
          fechaSolicitada: true,
          productos: true,
          pesoTotal: true,
          numProductosTipo: true,
        },
      },
    },
    orderBy: { orden: 'asc' as const },
  },
} as const;

// ── Generar código de ticket ───────────────────────────────────────────────
async function generarCodigoTicket(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TK-${year}-`;
  const last = await prisma.ticket.findFirst({
    where: { codigo: { startsWith: prefix } },
    orderBy: { codigo: 'desc' },
  });
  let next = 1;
  if (last) {
    const parts = last.codigo.split('-');
    next = parseInt(parts[parts.length - 1] ?? '0', 10) + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

// ── Listar tickets ─────────────────────────────────────────────────────────
export async function listTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { semana, tipo, estado, repartidorId } = req.query;
    const where: Record<string, unknown> = {};

    if (tipo && typeof tipo === 'string') where.tipo = tipo;
    if (estado && typeof estado === 'string') where.estado = estado;
    if (repartidorId && typeof repartidorId === 'string') {
      where.repartidorId = parseInt(repartidorId, 10);
    }

    // Filtrar por semana (fecha ISO del lunes de la semana)
    if (semana && typeof semana === 'string') {
      const lunes = new Date(semana);
      const domingo = new Date(semana);
      domingo.setDate(domingo.getDate() + 6);
      where.fecha = { lte: domingo };
      where.OR = [
        { fechaFin: null, fecha: { gte: lunes } },
        { fechaFin: { gte: lunes } },
      ];
    }

    // Repartidores solo ven sus propios tickets del día de hoy
    if (req.user?.rol === 'repartidor') {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      where.repartidorId = req.user.id;
      where.fecha = { lte: manana };
      where.OR = [
        { fechaFin: null, fecha: { gte: hoy } },
        { fechaFin: { gte: hoy } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      select: ticketSelect,
      orderBy: [{ fecha: 'asc' }, { orden: 'asc' }],
    });
    res.json(tickets);
  } catch (err) { next(err); }
}

// ── Obtener ticket por ID ──────────────────────────────────────────────────
export async function getTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: ticketSelect });
    if (!ticket) { next(createError('Ticket no encontrado', 404)); return; }
    res.json(ticket);
  } catch (err) { next(err); }
}

// ── Crear ticket ───────────────────────────────────────────────────────────
export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as CreateTicketInput;
    const codigo = await generarCodigoTicket();

    const maxOrden = await prisma.ticket.aggregate({ _max: { orden: true } });
    const orden = (maxOrden._max.orden ?? 0) + 1;

    const ticket = await prisma.ticket.create({
      data: {
        codigo,
        tipo: data.tipo,
        fecha: new Date(data.fecha),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        descripcion: data.descripcion ?? null,
        repartidorId: data.repartidorId ?? null,
        horaSalida: data.horaSalida ?? null,
        notas: data.notas ?? null,
        orden,
        ticketPedidos: data.pedidoIds?.length
          ? {
              create: data.pedidoIds.map((pedidoId, i) => ({
                pedidoId,
                orden: i,
                active: true,
              })),
            }
          : undefined,
      },
      select: ticketSelect,
    });
    res.status(201).json(ticket);
  } catch (err) { next(err); }
}

// ── Actualizar ticket ──────────────────────────────────────────────────────
export async function updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body as UpdateTicketInput;
    const updateData: Record<string, unknown> = {};

    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.fecha !== undefined) updateData.fecha = new Date(data.fecha);
    if (data.fechaFin !== undefined) updateData.fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.repartidorId !== undefined) updateData.repartidorId = data.repartidorId;
    if (data.horaSalida !== undefined) updateData.horaSalida = data.horaSalida;
    if (data.notas !== undefined) updateData.notas = data.notas;
    if (data.estado !== undefined) updateData.estado = data.estado;

    // Actualizar lista de pedidos si se envía
    if (data.pedidoIds !== undefined) {
      // Desactivar todos los actuales
      await prisma.ticketPedido.updateMany({ where: { ticketId: id }, data: { active: false } });
      // Recrear la lista activa con el nuevo orden
      for (let i = 0; i < data.pedidoIds.length; i++) {
        const pedidoId = data.pedidoIds[i]!;
        await prisma.ticketPedido.upsert({
          where: { ticketId_pedidoId: { ticketId: id, pedidoId } },
          create: { ticketId: id, pedidoId, orden: i, active: true },
          update: { orden: i, active: true },
        });
      }
    }

    const ticket = await prisma.ticket.update({ where: { id }, data: updateData, select: ticketSelect });
    res.json(ticket);
  } catch (err) { next(err); }
}

// ── Eliminar ticket ────────────────────────────────────────────────────────
export async function deleteTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.ticket.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// ── Reordenar tickets en el tablero ───────────────────────────────────────
export async function reorderTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items } = req.body as { items: { id: number; orden: number }[] };
    await prisma.$transaction(
      items.map((item) => prisma.ticket.update({ where: { id: item.id }, data: { orden: item.orden } }))
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
}
