import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { loginSchema, createUserSchema, updateUserSchema } from '../schemas/auth.schema';
import { login, me, listUsers, createUser, updateUser } from '../controllers/auth.controller';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, me);

// Gestión de usuarios — solo admin
router.get('/users', requireAuth, requireRole('admin'), listUsers);
router.post('/users', requireAuth, requireRole('admin'), validate(createUserSchema), createUser);
router.patch('/users/:id', requireAuth, requireRole('admin'), validate(updateUserSchema), updateUser);

export default router;
