# GestorTaller

SaaS de gestión para talleres de reparación electrónicos.

## Tech Stack

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, TailwindCSS, Clerk |
| Backend    | Node.js, Express                    |
| DB         | PostgreSQL + Prisma ORM             |
| Auth       | Clerk (auth sin fricción)           |
| UI         | Lucide React, Recharts              |
| Forms      | React Hook Form + Zod               |
| API Client | Axios + TanStack React Query        |

## Estructura del proyecto

```
gestor-taller/
├── backend/
│   ├── prisma/          # Schema y migraciones
│   ├── src/
│   │   ├── config/      # Constantes, logger
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── middleware/   # Auth, validación, errores
│   │   ├── routes/       # Definición de rutas
│   │   ├── services/     # PDF, WhatsApp, etc.
│   │   ├── utils/        # Utilidades
│   │   └── index.js      # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # UI kit + layout + features
│   │   ├── pages/       # Páginas de la app
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # API client, utils, constants
│   │   ├── styles/      # CSS global (Tailwind)
│   │   └── App.jsx      # Router principal
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
└── docs/
    └── ROADMAP.md
```

## Requisitos

- Node.js 18+
- PostgreSQL (local o cloud)

## Setup rápido (para probar en otro equipo)

### 1. Base de datos

**Opción A — PostgreSQL local:**
```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE gestor_taller;"
```

**Opción B — Neon (cloud gratis, sin instalar PostgreSQL):**
1. Crear cuenta en https://neon.tech
2. Crear proyecto y copiar connection string

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env`:
```env
# Si usas PostgreSQL local:
DATABASE_URL="postgresql://postgres:TU_PASS@localhost:5432/gestor_taller?schema=public"

# Si usas Neon (cloud):
# DATABASE_URL="postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/gestor_taller?sslmode=require"

# Clerk (ya vienen keys de desarrollo que funcionan en cualquier PC)
CLERK_SECRET_KEY="sk_test_YpBYmsBDiNDh18qTJBHFRhzHtTmvQAuPBQ8bHFy2sl"
CLERK_WEBHOOK_SECRET="whsec_JytVYDeDGlfRnw52IZIjW5Jkje5x6p/6"
```

```bash
npm install
npx prisma migrate dev --name init
npm run dev
# Servidor en http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Abrir http://localhost:5173
```

> Las keys de Clerk en los `.env` son de **desarrollo** y funcionan en cualquier máquina. Para producción se cambian por keys reales.

## Variables de entorno

### Backend (.env)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/gestor_taller
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
PORT=3001
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:5173
```

### Frontend (.env)

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001/api
```

## API REST

| Método | Ruta                      | Descripción              |
|--------|---------------------------|--------------------------|
| GET    | /api/clients              | Listar clientes          |
| POST   | /api/clients              | Crear cliente            |
| GET    | /api/clients/:id          | Detalle cliente          |
| PUT    | /api/clients/:id          | Actualizar cliente       |
| DELETE | /api/clients/:id          | Eliminar cliente         |
| GET    | /api/clients/:id/history  | Historial del cliente    |
| GET    | /api/equipment            | Listar equipos           |
| POST   | /api/equipment            | Registrar equipo         |
| GET    | /api/equipment/:id        | Detalle equipo           |
| PUT    | /api/equipment/:id        | Actualizar equipo        |
| DELETE | /api/equipment/:id        | Eliminar equipo          |
| GET    | /api/orders               | Listar órdenes           |
| POST   | /api/orders               | Crear orden              |
| GET    | /api/orders/:id           | Detalle orden            |
| PUT    | /api/orders/:id           | Actualizar orden         |
| PUT    | /api/orders/:id/status    | Cambiar estado           |
| POST   | /api/orders/:id/payments  | Registrar pago           |
| POST   | /api/orders/:id/whatsapp  | Enviar WhatsApp          |
| GET    | /api/orders/:id/pdf       | Descargar PDF            |
| GET    | /api/dashboard/stats      | Estadísticas dashboard   |
| POST   | /api/webhooks/clerk       | Webhook Clerk            |
| GET    | /api/users/me             | Usuario actual           |
| GET    | /api/whatsapp/status      | Estado conexión WhatsApp |
| POST   | /api/whatsapp/connect     | Conectar WhatsApp (QR)   |

## Flujo de estados de reparación

```
PENDING → DIAGNOSING → IN_PROGRESS → READY_FOR_PICKUP → COMPLETED → DELIVERED
              ↓              ↓
          CANCELLED    WAITING_PARTS
                           ↓
                      IN_PROGRESS
```

## Modelo de datos (Prisma)

- **User** - Usuarios sincronizados con Clerk
- **Client** - Clientes del taller
- **Equipment** - Equipos registrados por cliente
- **RepairOrder** - Órdenes de reparación
- **StatusHistory** - Trazabilidad de cambios de estado
- **Payment** - Pagos registrados
- **AuditLog** - Log de auditoría

## Próximos pasos

Ver [ROADMAP.md](docs/ROADMAP.md) para el plan de desarrollo completo.
