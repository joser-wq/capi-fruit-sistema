import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import pedidoRoutes from './routes/pedido.routes';
import ticketRoutes from './routes/ticket.routes';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL ?? 'http://localhost:5173',
  process.env.WEB_URL ?? '',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Permitir llamadas sin origin (curl, Postman, servidor a servidor)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS no permitido'));
  },
  credentials: true,
}));

app.use(express.json());

// ── Rutas públicas ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// Endpoint web: público (sin requireAuth), CORS ya maneja la seguridad
app.use('/api/pedidos', pedidoRoutes);

// ── Rutas privadas (requieren JWT) ────────────────────────────────────────
app.use('/api/tickets', requireAuth, ticketRoutes);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Manejo de errores ─────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🍊 Capi Fruit API corriendo en http://localhost:${PORT}`);
});
