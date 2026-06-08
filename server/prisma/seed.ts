import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Usuarios base
  const adminPass = await bcrypt.hash('admin123', 12);
  const repPass = await bcrypt.hash('rep123', 12);
  const gerPass = await bcrypt.hash('ger123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@capifruit.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@capifruit.com',
      password: adminPass,
      rol: 'admin',
    },
  });

  const repartidor = await prisma.user.upsert({
    where: { email: 'rep@capifruit.com' },
    update: {},
    create: {
      nombre: 'Juan Repartidor',
      email: 'rep@capifruit.com',
      password: repPass,
      rol: 'repartidor',
    },
  });

  await prisma.user.upsert({
    where: { email: 'gerencia@capifruit.com' },
    update: {},
    create: {
      nombre: 'Gerencia',
      email: 'gerencia@capifruit.com',
      password: gerPass,
      rol: 'gerencia',
    },
  });

  // Pedido de ejemplo
  await prisma.pedido.upsert({
    where: { numeroPedido: 'CF-2026-0001' },
    update: {},
    create: {
      numeroPedido: 'CF-2026-0001',
      nombreCliente: 'Hotel Los Sueños',
      tipoCliente: 'hotel',
      productos: [
        { nombre: 'Piña', cantidad: 10, unidad: 'unidad', pesoKg: 20 },
        { nombre: 'Mango', cantidad: 5, unidad: 'kg', pesoKg: 5 },
        { nombre: 'Papaya', cantidad: 3, unidad: 'unidad', pesoKg: 6 },
      ],
      pesoTotal: 31,
      numProductosTipo: 3,
      esGrande: true,
      direccionEntrega: 'Carretera a Jacó, frente al Hotel Los Sueños',
      telefono: '2630-0000',
      fechaSolicitada: new Date(),
      estado: 'pendiente',
      origenWeb: false,
      createdById: admin.id,
    },
  });

  // Ticket de ruta de ejemplo
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  await prisma.ticket.upsert({
    where: { codigo: 'TK-2026-0001' },
    update: {},
    create: {
      codigo: 'TK-2026-0001',
      tipo: 'ruta',
      fecha: hoy,
      repartidorId: repartidor.id,
      horaSalida: '07:00',
      estado: 'borrador',
      orden: 1,
    },
  });

  console.log('✅ Seed completado');
  console.log('   admin@capifruit.com / admin123');
  console.log('   rep@capifruit.com / rep123');
  console.log('   gerencia@capifruit.com / ger123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
