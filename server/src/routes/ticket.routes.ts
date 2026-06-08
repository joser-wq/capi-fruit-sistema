import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireRole } from '../middleware/auth';
import { createTicketSchema, updateTicketSchema } from '../schemas/ticket.schema';
import {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  reorderTickets,
} from '../controllers/ticket.controller';

const router = Router();

router.get('/', listTickets);
router.get('/:id', getTicket);
router.post('/', requireRole('admin'), validate(createTicketSchema), createTicket);
router.post('/reorder', requireRole('admin'), reorderTickets);
router.patch('/:id', requireRole('admin'), validate(updateTicketSchema), updateTicket);
router.delete('/:id', requireRole('admin'), deleteTicket);

export default router;
