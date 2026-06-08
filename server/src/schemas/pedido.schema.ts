import { z } from 'zod';

const productoPedidoSchema = z.object({
  nombre: z.string().min(1, 'Nombre del producto requerido'),
  cantidad: z.number().positive('Cantidad debe ser positiva'),
  unidad: z.string().min(1, 'Unidad requerida'),
  pesoKg: z.number().nonnegative().optional(),
});

// Schema para pedidos creados desde el panel interno
export const createPedidoSchema = z.object({
  nombreCliente: z.string().min(1, 'Nombre del cliente requerido'),
  tipoCliente: z.enum(['hotel', 'restaurante', 'regular']),
  productos: z.array(productoPedidoSchema).min(1, 'Al menos un producto requerido'),
  direccionEntrega: z.string().min(1, 'Dirección de entrega requerida'),
  telefono: z.string().optional(),
  fechaSolicitada: z.string().min(1, 'Fecha solicitada requerida'),
  notas: z.string().optional(),
});

export type CreatePedidoInput = z.infer<typeof createPedidoSchema>;

// Schema para pedidos que llegan desde la página web (más permisivo)
export const createPedidoWebSchema = z.object({
  nombreCliente: z.string().min(1, 'Nombre del cliente requerido'),
  tipoCliente: z.enum(['hotel', 'restaurante', 'regular']).default('regular'),
  productos: z.array(productoPedidoSchema).min(1, 'Al menos un producto requerido'),
  direccionEntrega: z.string().min(1, 'Dirección de entrega requerida'),
  telefono: z.string().optional(),
  fechaSolicitada: z.string().optional(),
  notas: z.string().optional(),
});

export type CreatePedidoWebInput = z.infer<typeof createPedidoWebSchema>;

export const updatePedidoSchema = z.object({
  nombreCliente: z.string().min(1).optional(),
  tipoCliente: z.enum(['hotel', 'restaurante', 'regular']).optional(),
  productos: z.array(productoPedidoSchema).min(1).optional(),
  direccionEntrega: z.string().min(1).optional(),
  telefono: z.string().nullable().optional(),
  fechaSolicitada: z.string().optional(),
  estado: z.enum(['pendiente', 'aceptado', 'enPreparacion', 'enCamino', 'entregado']).optional(),
  notas: z.string().nullable().optional(),
});

export type UpdatePedidoInput = z.infer<typeof updatePedidoSchema>;
