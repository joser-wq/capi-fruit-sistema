import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { createPedidoSchema, createPedidoWebSchema, updatePedidoSchema } from '../schemas/pedido.schema';
import {
  listPedidos,
  getPedido,
  createPedido,
  createPedidoWeb,
  updatePedido,
  deletePedido,
} from '../controllers/pedido.controller';

const router = Router();

// ── Endpoint público para la página web ──────────────────────────────────
// La página web llama POST /api/pedidos/nuevo cuando el cliente confirma el carrito
router.post('/nuevo', validate(createPedidoWebSchema), createPedidoWeb);

// ── Endpoints del panel interno (requieren auth) ──────────────────────────
router.get('/', requireAuth, listPedidos);
router.get('/:id', requireAuth, getPedido);
router.post('/', requireAuth, requireRole('admin'), validate(createPedidoSchema), createPedido);
router.patch('/:id', requireAuth, requireRole('admin'), validate(updatePedidoSchema), updatePedido);
router.delete('/:id', requireAuth, requireRole('admin'), deletePedido);

export default router;
