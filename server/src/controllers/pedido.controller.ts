import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import type { CreatePedidoInput, CreatePedidoWebInput, UpdatePedidoInput } from '../schemas/pedido.schema';

// ── Selector de campos estándar ────────────────────────────────────────────
const pedidoSelect = {
  id: true,
  numeroPedido: true,
  nombreCliente: true,
  tipoCliente: true,
  productos: true,
  pesoTotal: true,
  numProductosTipo: true,
  esGrande: true,
  direccionEntrega: true,
  telefono: true,
  fechaSolicitada: true,
  estado: true,
  notas: true,
  origenWeb: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  ticketPedidos: {
    where: { active: true },
    include: {
      ticket: {
        select: {
          id: true,
          codigo: true,
          tipo: true,
          fecha: true,
          estado: true,
          repartidor: { select: { nombre: true } },
        },
      },
    },
    orderBy: { orden: 'asc' as const },
  },
} as const;

// ── Generar número de pedido ───────────────────────────────────────────────
async function generarNumeroPedido(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CF-${year}-`;
  const last = await prisma.pedido.findFirst({
    where: { numeroPedido: { startsWith: prefix } },
    orderBy: { numeroPedido: 'desc' },
  });
  let next = 1;
  if (last) {
    const parts = last.numeroPedido.split('-');
    next = parseInt(parts[parts.length - 1] ?? '0', 10) + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
}

// ── Calcular peso y tamaño ─────────────────────────────────────────────────
interface ProductoItem { pesoKg?: number; }
function calcularMetricas(productos: ProductoItem[]): { pesoTotal: number; numProductosTipo: number; esGrande: boolean } {
  const pesoTotal = productos.reduce((s, p) => s + (p.pesoKg ?? 0), 0);
  const numProductosTipo = productos.length;
  const esGrande = pesoTotal > 5 || numProductosTipo >= 3;
  return { pesoTotal, numProductosTipo, esGrande };
}

// ── Listar pedidos ─────────────────────────────────────────────────────────
export async function listPedidos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { estado, tipoCliente, fecha } = req.query;
    const where: Record<string, unknown> = {};
    if (estado && typeof estado === 'string') where.estado = estado;
    if (tipoCliente && typeof tipoCliente === 'string') where.tipoCliente = tipoCliente;
    if (fecha && typeof fecha === 'string') {
      const start = new Date(fecha);
      const end = new Date(fecha);
      end.setDate(end.getDate() + 1);
      where.fechaSolicitada = { gte: start, lt: end };
    }
    const pedidos = await prisma.pedido.findMany({
      where,
      select: pedidoSelect,
      orderBy: { createdAt: 'desc' },
    });
    res.json(pedidos);
  } catch (err) { next(err); }
}

// ── Obtener pedido por ID ──────────────────────────────────────────────────
export async function getPedido(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const pedido = await prisma.pedido.findUnique({ where: { id }, select: pedidoSelect });
    if (!pedido) { next(createError('Pedido no encontrado', 404)); return; }
    res.json(pedido);
  } catch (err) { next(err); }
}

// ── Crear pedido desde el panel interno ───────────────────────────────────
export async function createPedido(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as CreatePedidoInput;
    const productos = data.productos as ProductoItem[];
    const { pesoTotal, numProductosTipo, esGrande } = calcularMetricas(productos);
    const numeroPedido = await generarNumeroPedido();
    const pedido = await prisma.pedido.create({
      data: {
        numeroPedido,
        nombreCliente: data.nombreCliente,
        tipoCliente: data.tipoCliente,
        productos: data.productos,
        pesoTotal,
        numProductosTipo,
        esGrande,
        direccionEntrega: data.direccionEntrega,
        telefono: data.telefono ?? null,
        fechaSolicitada: new Date(data.fechaSolicitada),
        notas: data.notas ?? null,
        origenWeb: false,
        createdById: req.user?.id ?? null,
      },
      select: pedidoSelect,
    });
    res.status(201).json(pedido);
  } catch (err) { next(err); }
}

// ── Crear pedido desde la página web (endpoint público) ───────────────────
export async function createPedidoWeb(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as CreatePedidoWebInput;
    const productos = data.productos as ProductoItem[];
    const { pesoTotal, numProductosTipo, esGrande } = calcularMetricas(productos);
    const numeroPedido = await generarNumeroPedido();
    const fechaSolicitada = data.fechaSolicitada ? new Date(data.fechaSolicitada) : new Date();
    const pedido = await prisma.pedido.create({
      data: {
        numeroPedido,
        nombreCliente: data.nombreCliente,
        tipoCliente: data.tipoCliente ?? 'regular',
        productos: data.productos,
        pesoTotal,
        numProductosTipo,
        esGrande,
        direccionEntrega: data.direccionEntrega,
        telefono: data.telefono ?? null,
        fechaSolicitada,
        notas: data.notas ?? null,
        origenWeb: true,
      },
      select: {
        id: true,
        numeroPedido: true,
        nombreCliente: true,
        estado: true,
        esGrande: true,
        createdAt: true,
      },
    });
    res.status(201).json({
      ok: true,
      numeroPedido: pedido.numeroPedido,
      mensaje: `Pedido ${pedido.numeroPedido} recibido correctamente`,
    });
  } catch (err) { next(err); }
}

// ── Actualizar pedido ──────────────────────────────────────────────────────
export async function updatePedido(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body as UpdatePedidoInput;
    const updateData: Record<string, unknown> = { updatedById: req.user?.id ?? null };
    if (data.nombreCliente !== undefined) updateData.nombreCliente = data.nombreCliente;
    if (data.tipoCliente !== undefined) updateData.tipoCliente = data.tipoCliente;
    if (data.direccionEntrega !== undefined) updateData.direccionEntrega = data.direccionEntrega;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.fechaSolicitada !== undefined) updateData.fechaSolicitada = new Date(data.fechaSolicitada);
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.notas !== undefined) updateData.notas = data.notas;
    if (data.productos !== undefined) {
      const prods = data.productos as ProductoItem[];
      const { pesoTotal, numProductosTipo, esGrande } = calcularMetricas(prods);
      updateData.productos = data.productos;
      updateData.pesoTotal = pesoTotal;
      updateData.numProductosTipo = numProductosTipo;
      updateData.esGrande = esGrande;
    }
    const pedido = await prisma.pedido.update({ where: { id }, data: updateData, select: pedidoSelect });
    res.json(pedido);
  } catch (err) { next(err); }
}

// ── Eliminar pedido ────────────────────────────────────────────────────────
export async function deletePedido(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.pedido.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}
