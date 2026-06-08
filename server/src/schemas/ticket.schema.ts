import { z } from 'zod';

export const createTicketSchema = z.object({
  tipo: z.enum(['ruta', 'mantenimiento']),
  fecha: z.string().min(1, 'Fecha requerida'),
  fechaFin: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  repartidorId: z.number().int().positive().nullable().optional(),
  horaSalida: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  pedidoIds: z.array(z.number().int().positive()).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  tipo: z.enum(['ruta', 'mantenimiento']).optional(),
  fecha: z.string().optional(),
  fechaFin: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  repartidorId: z.number().int().positive().nullable().optional(),
  horaSalida: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  estado: z.enum(['borrador', 'asignado', 'enRuta', 'completado']).optional(),
  pedidoIds: z.array(z.number().int().positive()).optional(),
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
