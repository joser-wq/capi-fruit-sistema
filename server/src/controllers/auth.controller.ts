import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { createError } from '../middleware/errorHandler';
import type { LoginInput, CreateUserInput, UpdateUserInput } from '../schemas/auth.schema';
import type { JwtPayload } from '../middleware/auth';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as LoginInput;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.activo) { next(createError('Credenciales inválidas', 401)); return; }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { next(createError('Credenciales inválidas', 401)); return; }
    const secret = process.env.JWT_SECRET!;
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];
    const payload: JwtPayload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
    const token = jwt.sign(payload, secret, { expiresIn });
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (err) { next(err); }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) { next(createError('No autenticado', 401)); return; }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    if (!user || !user.activo) { next(createError('Usuario no encontrado', 404)); return; }
    res.json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (err) { next(err); }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as CreateUserInput;
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) { next(createError('Ya existe un usuario con ese email', 409)); return; }
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { nombre: data.nombre, email: data.email, password: hashed, rol: data.rol },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body as UpdateUserInput;
    const updateData: Record<string, unknown> = {};
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.email) updateData.email = data.email;
    if (data.rol) updateData.rol = data.rol;
    if (typeof data.activo === 'boolean') updateData.activo = data.activo;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    res.json(user);
  } catch (err) { next(err); }
}
