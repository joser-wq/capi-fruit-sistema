# Capi Fruit — Sistema de Pedidos

## Pasos para arrancar

### 1. Instalar dependencias
```bash
npm run install:all
```

### 2. Configurar variables de entorno del servidor
```bash
cp server/.env.example server/.env
# Editar server/.env con tu DATABASE_URL y JWT_SECRET
```

### 3. Crear la base de datos y correr las migraciones
```bash
cd server
npx prisma db push       # o: npx prisma migrate dev --name init
npx prisma generate
npm run db:seed           # crea usuarios y datos de ejemplo
cd ..
```

### 4. Arrancar en modo desarrollo
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend:  http://localhost:3001

## Usuarios de prueba (seed)
| Email                     | Contraseña | Rol           |
|---------------------------|------------|---------------|
| admin@capifruit.com       | admin123   | Administrador |
| rep@capifruit.com         | rep123     | Repartidor    |
| gerencia@capifruit.com    | ger123     | Gerencia      |

## Endpoint para la página web
```
POST http://tu-servidor.com/api/pedidos/nuevo
Content-Type: application/json

{
  "nombreCliente": "Hotel Los Sueños",
  "tipoCliente": "hotel",
  "productos": [
    { "nombre": "Piña", "cantidad": 10, "unidad": "unidad", "pesoKg": 20 },
    { "nombre": "Mango", "cantidad": 5, "unidad": "kg", "pesoKg": 5 }
  ],
  "direccionEntrega": "Carretera a Jacó",
  "telefono": "2630-0000",
  "fechaSolicitada": "2026-06-10"
}
```

El pedido aparece en el panel con estado **pendiente** automáticamente.

## Estructura de archivos
```
capi-fruit-sistema/
├── client/              # React + TypeScript + Vite
│   └── src/
│       ├── types/       # Tipos adaptados para Capi Fruit
│       ├── lib/         # api.ts, formatters.ts, cn.ts
│       ├── contexts/    # AuthContext
│       ├── components/  # Layout, Button, Toast, ConfirmDialog
│       └── pages/       # BoardPage, PedidosPage, ReportesPage...
└── server/              # Node.js + Express + Prisma
    ├── prisma/          # schema.prisma + seed.ts
    └── src/
        ├── middleware/  # auth, errorHandler, validate
        ├── schemas/     # Zod schemas
        ├── controllers/ # auth, pedido, ticket
        └── routes/      # auth, pedido, ticket
```
