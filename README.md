# GestorTaller

SaaS de gestión para talleres de reparación electrónicos.

## Tech Stack

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, TailwindCSS         |
| Backend    | Node.js, Express                    |
| DB         | SQLite + Prisma ORM                 |
| Auth       | JWT local (bcrypt + jsonwebtoken)   |
| UI         | Lucide React, Recharts              |
| Forms      | React Hook Form                     |
| API Client | Axios + TanStack React Query        |

## Estructura del proyecto

```
gestor-taller/
├── backend/
│   ├── prisma/          # Schema y base SQLite
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
│   └── vite.config.js
├── ecosystem.config.js  # Config para PM2
├── start.sh             # Script de inicio para NAS
└── package.json         # Scripts de setup y start
```

## Requisitos

- **Node.js 18+** (solo esto, no necesita PostgreSQL ni nada más)

## Instalación rápida (desarrollo)

```bash
# 1. Clonar
git clone https://github.com/Zenderoko/gestor-taller-reparacion.git
cd gestor-taller-reparacion

# 2. Backend
cd backend
npm install
npx prisma db push          # crea la base SQLite
node prisma/seed.js         # crea admin@gestortaller.cl / admin123
npm run dev                  # backend en http://localhost:3001

# 3. Frontend (otra terminal)
cd frontend
npm install
npm run dev                  # frontend en http://localhost:5173
```

Abrir `http://localhost:5173` e iniciar sesión con `admin@gestortaller.cl` / `admin123`.

## Instalación en producción (PC o NAS)

```bash
# Un solo comando
git clone https://github.com/Zenderoko/gestor-taller-reparacion.git
cd gestor-taller-reparacion
npm run setup
```

Esto ejecuta automáticamente: instalar dependencias backend → crear DB → seed → instalar frontend → build.

Luego editar `backend/.env`:

```env
NODE_ENV=production
JWT_SECRET=clave-segura-aleatoria      # cambiar obligatoriamente
APP_URL=http://192.168.1.100:3001      # IP del servidor
```

Iniciar:

```bash
npm start
```

Acceder desde cualquier equipo de la red: `http://192.168.1.100:3001`

## Variables de entorno

### Backend (backend/.env)

```
DATABASE_URL="file:./dev.db"          # SQLite local
JWT_SECRET=clave-secreta              # cambiar en producción
JWT_EXPIRES_IN=7d
NODE_ENV=development                  # o production
PORT=3001
FRONTEND_URL=http://localhost:5173    # solo para desarrollo
APP_URL=http://localhost:3001         # IP o dominio público
```

## API REST

| Método | Ruta                      | Descripción              |
|--------|---------------------------|--------------------------|
| POST   | /api/auth/login           | Iniciar sesión           |
| POST   | /api/auth/register        | Registrar primer usuario |
| PUT    | /api/auth/password        | Cambiar contraseña       |
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
| DELETE | /api/orders/:id           | Eliminar orden           |
| PUT    | /api/orders/:id/archive   | Archivar orden           |
| PUT    | /api/orders/:id/unarchive | Restaurar orden          |
| GET    | /api/dashboard/stats      | Estadísticas dashboard   |
| GET    | /api/users/me             | Usuario actual           |
| GET    | /api/users                | Listar usuarios          |
| GET    | /api/whatsapp/status      | Estado conexión WhatsApp |
| POST   | /api/whatsapp/connect     | Conectar WhatsApp (QR)   |
| GET    | /api/health               | Health check             |

## Flujo de estados de reparación

```
PENDING → DIAGNOSING → IN_PROGRESS → READY_FOR_PICKUP → COMPLETED → DELIVERED
              ↓              ↓
          CANCELLED    WAITING_PARTS
                           ↓
                      IN_PROGRESS
```

## Modelo de datos (Prisma)

- **User** - Usuarios del sistema (JWT local)
- **Client** - Clientes del taller
- **Equipment** - Equipos registrados por cliente
- **RepairOrder** - Órdenes de reparación
- **StatusHistory** - Trazabilidad de cambios de estado
- **Payment** - Pagos registrados
- **AuditLog** - Log de auditoría

## Despliegue en NAS con auto-inicio

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup   # arranque automático al encender
pm2 save
```

Ver [Avances.MD](./Avances.MD) para documentación detallada.
