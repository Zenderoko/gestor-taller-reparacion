# Avances - Gestor Taller

## Fecha: 27/05/2026

---

### 1. Configuración de entorno

- Instalado `dotenv` en backend para cargar variables de entorno desde `.env`
- Agregado `import 'dotenv/config'` en `backend/src/index.js`
- Instalado `@clerk/clerk-sdk-node` en backend

### 2. Corrección de autenticación (Clerk)

**Problema**: Las peticiones al backend siempre respondían 401 "No autorizado".

**Causas encontradas y soluciones**:

1. **`window.Clerk` no existe en Clerk v5 React**
   - Creado `frontend/src/lib/auth-token.js` — módulo que almacena la función `getToken` globalmente
   - Creado `frontend/src/components/ClerkTokenProvider.jsx` — componente que usa `useAuth()` de Clerk y pasa `getToken` al módulo auth-token
   - Actualizado `frontend/src/main.jsx` para incluir `ClerkTokenProvider`
   - Actualizado `frontend/src/lib/api.js` — el interceptor de axios ahora usa `getAuthToken()` en vez de `window.Clerk`

2. **Token JWT expiraba por caché**
   - Agregado `{ skipCache: true }` en `getAuthToken()` para forzar token fresco siempre

3. **Backend usaba API incorrecta para verificar token**
   - Cambiado `verifySession({ sessionId })` (incorrecto) por `clerkClient.verifyToken(token)` (correcto)
   - Agregados `clockSkewInMs: 600000` y `jwksCacheTtlInMs: 600000` para tolerar diferencias de tiempo y cachear JWKS

**Archivos modificados**:
- `backend/src/index.js` — dotenv
- `backend/src/middleware/auth.js` — verifyToken con clockSkew y jwksCache
- `frontend/src/lib/auth-token.js` — nuevo
- `frontend/src/lib/api.js` — interceptor con getAuthToken
- `frontend/src/components/ClerkTokenProvider.jsx` — nuevo
- `frontend/src/main.jsx` — ClerkTokenProvider

### 3. Prevención de clientes duplicados por RUT

- Agregado `@unique` al campo `documentId` en `backend/prisma/schema.prisma`
- Agregada validación en `create()` y `update()` de `clientController.js`
- Ejecutado `prisma db push --accept-data-loss`

**Archivos modificados**:
- `backend/prisma/schema.prisma` — documentId @unique
- `backend/src/controllers/clientController.js` — validación duplicados

### 4. Corrección de foreign key en createdBy

**Problema**: Al crear cliente, error `Foreign key constraint violated` porque el webhook de Clerk no estaba configurado y el usuario no existía en la BD local.

**Solución**: Eliminada la relación foránea entre `Client.createdBy` y `User.clerkId`. `createdBy` queda como string simple.

**Archivos modificados**:
- `backend/prisma/schema.prisma` — eliminada relación `user` en Client y `clients` en User

### 5. Refresco automático de lista de clientes

- Agregado `queryClient.invalidateQueries({ queryKey: ['clients'] })` después de crear un cliente

**Archivos modificados**:
- `frontend/src/pages/Clients.jsx` — invalidateQueries en onSubmit

### 6. Dashboard - Texto completo en tarjetas

- Eliminada clase `truncate` de las etiquetas en StatCard para que se vea el texto completo

**Archivos modificados**:
- `frontend/src/components/dashboard/StatCard.jsx` — removed truncate

### 7. Edición de datos (UPDATE)

Agregados modales de edición para las tres entidades principales:

**Clientes** (`ClientDetail.jsx`):
- Botón "Editar" en la vista de detalle
- Modal con campos: nombre, teléfono, email, documento, dirección, notas
- Invalida caché al guardar

**Órdenes** (`OrderDetail.jsx`):
- Botón "Editar orden" en sección de acciones
- Modal con: presupuesto, total, abono, prioridad, diagnóstico, notas, notas internas
- Agregado `estimatedCost` al controlador `update()` del backend

**Equipos** (`Equipment.jsx`):
- Icono de lápiz por cada fila para editar
- Modal con todos los campos: cliente, tipo, marca, modelo, serie, contraseña, accesorios, estado físico, notas

**Archivos modificados**:
- `frontend/src/pages/ClientDetail.jsx` — modal de edición
- `frontend/src/pages/OrderDetail.jsx` — modal de edición + rename "Seña" → "Abono"
- `frontend/src/pages/Equipment.jsx` — modal de edición
- `backend/src/controllers/orderController.js` — campo estimatedCost en update, deposit atómico, auto-creación de Payment al editar

---

### 8. Formato CLP (Peso Chileno) sin decimales

- Cambiada función `formatCurrency()` en `frontend/src/lib/utils.js` de `es-AR`/`ARS` a `es-CL`/`CLP` con 0 decimales
- Actualizados todos los inputs numéricos de precios de `step="0.01"` a `step="1"`

**Archivos modificados**:
- `frontend/src/lib/api.js` — authApi
- `frontend/src/pages/Login.jsx` — toggle register
- `frontend/src/components/layout/TopBar.jsx` — modal cambio contraseña

---

### 24. Migración de PostgreSQL a SQLite

**Motivación**: Cada instalación necesita su propia base de datos. Con PostgreSQL el usuario tiene que instalar y configurar un servidor de base de datos. SQLite es un solo archivo, cero configuración.

**Cambios**:
- `schema.prisma`: `provider` cambiado de `postgresql` a `sqlite`
- Enums (`RepairStatus`, `Priority`, `UserRole`, `EquipmentType`) reemplazados por `String` (SQLite no soporta enums)
- `Decimal` → `Float` (compatible con SQLite)
- Eliminado `mode: 'insensitive'` de las búsquedas (SQLite es case-insensitive por defecto con `LIKE`)
- `DATABASE_URL` en `.env` cambia de `postgresql://...` a `file:./dev.db`
- `.gitignore` incluye `*.db` y `*.db-journal`

**Cómo iniciar en un PC nuevo**:
1. Clonar el repo, configurar `.env` (solo JWT_SECRET)

Backend:
```bash
cd backend
npm install
npx prisma db push
node prisma/seed.js   # crea admin@gestortaller.cl / admin123
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

**Archivos modificados**:
- `backend/prisma/schema.prisma` — SQLite + String en vez de enums
- `backend/.env` — DATABASE_URL sqlite
- `backend/src/controllers/orderController.js` — sin mode insensitive
- `backend/src/controllers/equipmentController.js` — sin mode insensitive
- `backend/src/controllers/clientController.js` — sin mode insensitive
- `.gitignore` — *.db

---

### Pendientes / Próximos pasos

- **WhatsApp — número dedicado para el taller**: Usar un chip prepago solo para el taller, instalar WhatsApp en un celular viejo y escanear el QR con ese número. Así los mensajes salen del número del taller, no del personal.
- **WhatsApp Business API**: Alternativa más profesional con hasta 1000 mensajes gratis al mes vía Meta, requiere verificación de empresa.

--- 

### 24. Preparación para producción (NAS)

**Objetivo**: Poder instalar el proyecto en un NAS para venderlo como solución llave en mano (NAS + software funcionando).

#### Cambios necesarios:

1. **Clerk — Keys de producción**
   - `CLERK_SECRET_KEY`: `sk_test_...` → `sk_live_...` (en `backend/.env`)
   - `CLERK_PUBLISHABLE_KEY`: `pk_test_...` → `pk_live_...` (en `backend/.env`)
   - `VITE_CLERK_PUBLISHABLE_KEY`: `pk_test_...` → `pk_live_...` (en `frontend/.env`)
   - **Webhook**: El endpoint actual `POST /api/webhooks/clerk` no cambia. En el Dashboard de Clerk hay que crear un nuevo endpoint de producción con la misma URL pero apuntando a la IP/dominio del NAS, usando el nuevo `CLERK_WEBHOOK_SECRET` que Clerk genera.

2. **Frontend — Build de producción**
   - `npm run build` genera `frontend/dist/` con archivos estáticos minificados
   - Ya no se necesita Vite corriendo (solo para desarrollo)
   - Los archivos estáticos se sirven desde Express o Nginx

3. **Backend — Servir frontend estático**
   - Agregar `express.static` para servir `frontend/dist/`
   - Ya no se necesita el proxy de Vite ni CORS entre frontend/backend

4. **Variables de entorno para producción** (`backend/.env`)
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://ip-del-nas:3001
   APP_URL=https://ip-del-nas:3001
   ```

5. **PM2 — Gestor de procesos**
   - Instalar PM2 globalmente: `npm install -g pm2`
   - Crear archivo `ecosystem.config.js` para arranque automático
   - `pm2 startup` para que el backend arranque al encender el NAS

6. **Logging — Menos verboso en producción**
   - Ya implementado via `logger.js`: en `NODE_ENV=production` solo registra desde nivel `info` (omite `debug`)

7. **Seguridad**
   - Helmet ya está configurado (middleware de seguridad HTTP)
   - CORS configurado dinámicamente según `FRONTEND_URL`
   - Revisar que Clerk JWT tenga `clockSkewInMs` suficiente para entornos con hora no sincronizada (ya configurado en auth.js)

**Archivos a modificar**:
- `backend/.env` — claves de producción + NODE_ENV
- `frontend/.env` — VITE_CLERK_PUBLISHABLE_KEY de producción
- `backend/src/index.js` — agregar express.static para servir frontend
- `backend/ecosystem.config.js` — nuevo (configuración PM2)

---

### 22. Multi-tenencia — Aislamiento de datos por negocio

**Situación actual**: Todos los usuarios comparten la misma base de datos. No hay aislamiento por sesión/usuario.

**Cambios necesarios para implementar**:

1. **Esquema (Prisma)**:
   - Agregar `businessId String` a las tablas: `clients`, `equipments`, `repair_orders`, `payments`, `status_history`
   - Agregar índice compuesto donde corresponda

2. **Registro de usuario (Webhook Clerk)**:
   - Al crear un usuario, asignarle un `businessId` único (puede ser su `clerkId` o un UUID dedicado)
   - Si se usa modelo por negocio (varios usuarios por taller), crear una tabla `Business` y asociar usuarios a ella

3. **Auth middleware**:
   - En `auth.js`, después de verificar el token, obtener el `businessId` del usuario desde la BD local y agregarlo a `req.auth.businessId`

4. **Controladores**:
   - En cada `list()`, `getById()`, `create()`, `update()`, `remove()`, `archive()`, `unarchive()` — agregar filtro `businessId: req.auth.businessId` en todas las consultas
   - En `create()`, asignar `businessId: req.auth.businessId` al crear registros
   - Dashboard: filtrar todas las agregaciones por `businessId`

5. **Middleware global opcional**:
   - Crear un middleware que inyecte `businessId` automáticamente en `req` y lo agregue a `prisma` queries por defecto usando `prisma.$extends`

**Archivos a modificar**:
- `backend/prisma/schema.prisma` — businessId en todas las tablas
- `backend/src/middleware/auth.js` — lookup de businessId
- `backend/src/controllers/*.js` — filtros businessId en todos
- `backend/src/routes/webhooks.js` — asignar businessId al crear usuario

---

### 23. Empaquetado para distribución (portable / .exe)

**Objetivo**: Poder ejecutar el proyecto en otro PC sin instalar VSCode, Node.js ni PostgreSQL. Que funcione con doble clic como un programa normal.

**Opciones evaluadas**:

| Opción | WhatsApp | Peso | Requisitos | Descripción |
|--------|----------|------|------------|-------------|
| **A1** — SQLite + .exe (pkg) | ❌ No funciona | ~50 MB | Ninguno | PostgreSQL → SQLite, frontend servido desde backend, compilado con `pkg`. WhatsApp no funciona porque wppconnect necesita Chromium. |
| **A2** — SQLite + .exe + Chromium | ✅ Sí | ~200 MB | Ninguno | Igual que A1 pero incluye Chromium portátil para wppconnect. El .exe pesa bastante. |
| **B** — Docker Compose | ✅ Sí | ~200 MB | Docker Desktop | PostgreSQL + backend + frontend en contenedores. WhatsApp funciona (Chromium dentro del contenedor). Un solo comando: `docker compose up`. |
| **C** — Script .bat + SQLite | ✅ Sí | ~80 MB | Solo Windows | Cambio a SQLite, script que descarga Node.js portable, instala deps y arranca todo. Sin compilar, funciona en Node.js real. |

**Decisión**: Pendiente para revisar más adelante.
