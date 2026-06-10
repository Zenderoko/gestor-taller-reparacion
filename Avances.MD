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
- `frontend/src/lib/utils.js` — locale CLP
- `frontend/src/pages/OrderDetail.jsx` — step="1" en inputs
- `frontend/src/pages/NewOrder.jsx` — step="1" en input

---

### 9. Tooltips en sidebar colapsada

- Agregado tooltip oscuro al hacer hover sobre iconos de la barra lateral cuando está colapsada

**Archivos modificados**:
- `frontend/src/components/layout/Sidebar.jsx` — tooltips con group-hover

---

### 10. Corrección pagos (abono) y saldo restante

**Problema**: Al agregar un abono, el saldo restante se mostraba como $0.
**Causa**: `remaining = totalCost - deposit` con `Math.max(0, remaining)` ocultaba valores negativos. Además `addPayment` no era atómico.

**Soluciones**:
- Cambiado `remaining` a `estimatedCost - deposit` (presupuesto - abono)
- Eliminado `Math.max(0, ...)` para mostrar valores reales (negativo = saldo a favor)
- `addPayment` ahora usa `prisma.$transaction` con `deposit: { increment: amount }` para evitar race conditions
- Al editar una orden, si el `deposit` aumentó, se crea automáticamente un `Payment` con la diferencia (método `AJUSTE`)
- Botón "Registrar pago" se deshabilita si el abono ya cubre el presupuesto

**Archivos modificados**:
- `backend/src/controllers/orderController.js` — addPayment atómico, auto-Payment en update
- `frontend/src/pages/OrderDetail.jsx` — remaining con estimatedCost, sin Math.max, botón disabled

---

### 11. Dashboard - Ingresos del mes corregido

**Problema**: "Ingresos del mes" siempre mostraba $0.
**Causa**: Sumaba `totalCost` de órdenes COMPLETED/DELIVERED del mes (casi siempre vacío).
**Solución**: Ahora suma `Payment.amount` de los pagos registrados en el mes.

**Archivos modificados**:
- `backend/src/controllers/dashboardController.js` — revenue desde Payment.amount

---

### 12. Dashboard - Nueva tarjeta "Total de las órdenes"

- Reemplazada tarjeta "Total órdenes" (contador) por "Total de las órdenes" que muestra la suma de `totalCost` de todas las órdenes
- Agregada consulta `repairOrder.aggregate({ _sum: totalCost })` en el backend
- Eliminada variable muerta `startOfWeek`

**Archivos modificados**:
- `backend/src/controllers/dashboardController.js` — totalCost aggregator
- `frontend/src/pages/Dashboard.jsx` — label y value actualizados

---

### 13. Renombres en UI

- "Presupuesto" → "Presupuesto estimado" (vista y modal de edición)
- "Total" → "Costo final" (vista y modal de edición)

**Archivos modificados**:
- `frontend/src/pages/OrderDetail.jsx` — labels actualizados

---

### 14. Webhook Clerk — corrección de firma Svix + sincronización

**Problema**: El webhook usaba `JSON.stringify(req.body)` para verificar la firma, pero Svix necesita el body raw original.

**Soluciones**:
- Movido `express.raw({ type: 'application/json' })` antes del parseo JSON global para que los webhooks reciban el body sin modificar
- Cambiado `wh.verify(JSON.stringify(req.body), ...)` por `wh.verify(req.body, ...)` usando los svix-headers
- Agregado logging y más campos (avatar, teléfono) en la actualización de usuario
- Agregado `syncUserFromClerk()` en `GET /users/me` como fallback: si el webhook aún no ha sincronizado al usuario, lo crea bajo demanda desde la API de Clerk

**Archivos modificados**:
- `backend/src/index.js` — express.raw antes de express.json para webhooks
- `backend/src/routes/webhooks.js` — raw body + más datos en upsert
- `backend/src/routes/users.js` — sincronización fallback desde Clerk API

---

### 15. WhatsApp con wppconnect (reemplazo de Twilio)

**Problema**: Twilio Sandbox gratuito solo permite enviar a 1 número previa activación. Poco práctico.

**Solución**: Reemplazado Twilio por `@wppconnect-team/wppconnect` (v2.2.1). Conecta con WhatsApp Web real, sin límite de números ni costos recurrentes.

- Instalado `@wppconnect-team/wppconnect`
- Creado servicio `whatsappService.js` con:
  - `startConnection()` — inicia sesión y devuelve QR inmediatamente (no bloqueante)
  - `sendMessage(to, message)` — envía mensaje, espera conexión con timeout de 30s
  - `orderStatusMessage(order)` — genera mensaje formateado con estado de la orden
  - Manejo de reconexión con `client.onStateChange()`
  - Usa `catchQR` (no `onQR`) que es el callback correcto en v2.x
- Agregado `POST /api/orders/:id/whatsapp` — envía WhatsApp manual desde detalle de orden
- Agregado envío **automático** al cambiar estado de una orden (`updateStatus`)
- Agregada página `/whatsapp` en frontend con QR en vivo (polling cada 3s)
- Agregado link "WhatsApp" en la barra lateral
- Las sesiones se guardan en `tokens/gestor-taller/` para persistencia

**Archivos modificados/creados**:
- `backend/src/services/whatsappService.js` — reescrito con wppconnect
- `backend/src/routes/whatsapp.js` — nuevo (status + connect)
- `backend/src/routes/orders.js` — ruta POST /:id/whatsapp
- `backend/src/controllers/orderController.js` — sendWhatsApp + auto-envío
- `frontend/src/pages/WhatsAppSettings.jsx` — nuevo (página QR)
- `frontend/src/components/layout/Sidebar.jsx` — link a WhatsApp
- `frontend/src/lib/api.js` — whatsappApi + downloadPdf
- `frontend/src/App.jsx` — ruta /whatsapp
- `backend/package.json` — agregado @wppconnect-team/wppconnect

---

### 16. Generación de PDFs

- Corregido `pdfService.js` para usar formato CLP (peso chileno sin decimales) y locale `es-CL`
- Agregado `GET /api/orders/:id/pdf` — descarga PDF de la orden
- Conectado botón "Imprimir PDF" en `OrderDetail.jsx` (abre PDF en nueva pestaña)

**Archivos modificados**:
- `backend/src/services/pdfService.js` — formato CLP, locale es-CL
- `backend/src/controllers/orderController.js` — downloadPdf
- `backend/src/routes/orders.js` — ruta GET /:id/pdf
- `frontend/src/lib/api.js` — ordersApi.downloadPdf
- `frontend/src/pages/OrderDetail.jsx` — onClick en botón PDF

---

### 17. Búsqueda avanzada y filtros

**Órdenes**:
- Filtro por prioridad (baja, media, alta, urgente)
- Filtro por rango de fechas (desde / hasta)
- Backend: agregados parámetros `priority`, `startDate`, `endDate`

**Equipos**:
- Filtro por tipo de equipo (laptop, desktop, smartphone, etc.)

**Archivos modificados**:
- `backend/src/controllers/orderController.js` — filtros priority, startDate, endDate
- `backend/src/controllers/equipmentController.js` — filtro type
- `frontend/src/pages/Orders.jsx` — select de prioridad + inputs de fecha
- `frontend/src/pages/Equipment.jsx` — select de tipo de equipo

---

### 18. Archivar / Eliminar clientes, equipos y órdenes

**Problema**: No se podían eliminar registros y los datos se acumulaban sin posibilidad de limpieza.

**Solución**: Implementado sistema de archivado (soft-delete) + eliminación permanente.

**Modelo de datos**:
- Agregados campos `archived` (Boolean) y `archivedAt` (DateTime?) a Client, Equipment y RepairOrder

**Backend**:
- Listas filtran `archived: false` por defecto. Se pasa `showArchived=true` para ver archivados
- Controladores: `archive()`, `unarchive()`, `remove()` (permanente)
- Rutas: `PUT /:id/archive`, `PUT /:id/unarchive`, `DELETE /:id`

**Frontend**:
- Botón "Archivar" / "Restaurar" en detalle de cliente y orden
- Botón "Archivar" / "Restaurar" por fila en tabla de equipos
- Botón "Eliminar" con confirmación en detalle de cliente
- Toggle "Archivados" en listas de Clientes, Órdenes y Equipos

**Archivos modificados**:
- `backend/prisma/schema.prisma` — campos archived + archivedAt
- `backend/src/controllers/clientController.js` — archive, unarchive
- `backend/src/controllers/equipmentController.js` — archive, unarchive
- `backend/src/controllers/orderController.js` — archive, unarchive
- `backend/src/routes/clients.js` — rutas archive/unarchive
- `backend/src/routes/equipment.js` — rutas archive/unarchive
- `backend/src/routes/orders.js` — rutas archive/unarchive
- `frontend/src/lib/api.js` — archive, unarchive en APIs
- `frontend/src/pages/Clients.jsx` — toggle archivados
- `frontend/src/pages/ClientDetail.jsx` — botones archivar/restaurar/eliminar
- `frontend/src/pages/Orders.jsx` — toggle archivados
- `frontend/src/pages/OrderDetail.jsx` — botones archivar/restaurar
- `frontend/src/pages/Equipment.jsx` — toggle archivados + acciones por fila

---

---

### 19. Tooltips en botones de equipos

- Agregados tooltips al hacer hover sobre los iconos de editar, archivar/restaurar y eliminar en la tabla de equipos

**Archivos modificados**:
- `frontend/src/pages/Equipment.jsx` — tooltips con group-hover

---

### 20. Botón eliminar en detalle de orden

- Agregada mutación `deleteMutation` en `OrderDetail.jsx`
- Botón "Eliminar orden" con confirmación en sección de acciones
- Agregado `ordersApi.delete` en `api.js`
- Al eliminar, redirige a `/orders`

**Archivos modificados**:
- `frontend/src/lib/api.js` — delete en ordersApi
- `frontend/src/pages/OrderDetail.jsx` — deleteMutation + botón eliminar

---

### 21. Diseño responsive

**Sidebar responsive**:
- Sidebar se convierte en overlay deslizable en pantallas menores a `lg` (1024px)
- Botón hamburguesa (`Menu`) en TopBar para abrir sidebar en móvil
- Fondo oscuro (overlay) al abrir sidebar, cierra al hacer clic fuera o en la X
- Navegación cierra sidebar al hacer clic en un enlace

**TopBar responsive**:
- Fecha abreviada en móvil (día/mes), completa en desktop
- Email del usuario oculto en tablets y móviles
- Padding responsive (`px-4 sm:px-6`)
- Botón menú hamburguesa visible solo en móvil (`lg:hidden`)

**Pagination responsive**:
- Texto "Página X de Y" oculto en móvil (`hidden sm:block`)

**RecentOrdersTable**:
- Envuelta en `overflow-x-auto` para scroll horizontal en móvil

**WhatsApp QR**:
- Código QR responsive: `w-48 h-48` en móvil, `w-64 h-64` en desktop

**Card responsive**:
- Padding de `.card-header` y `.card-body` responsivo: `px-4 sm:px-6` y `p-4 sm:p-6` para mejor espacio en móvil

**Archivos modificados**:
- `frontend/src/styles/globals.css` — padding responsive en card-header y card-body
- `frontend/src/components/layout/DashboardLayout.jsx` — sidebarOpen state
- `frontend/src/components/layout/Sidebar.jsx` — overlay responsive, props open/onClose
- `frontend/src/components/layout/TopBar.jsx` — hamburger menu, fecha responsive
- `frontend/src/components/ui/Pagination.jsx` — texto responsive
- `frontend/src/components/dashboard/RecentOrdersTable.jsx` — overflow-x-auto
- `frontend/src/pages/WhatsAppSettings.jsx` — QR responsive

---

---

### 22. Autenticación local (reemplazo de Clerk)

**Motivación**: Clerk requiere internet, cuenta externa y claves API. Para ejecución local y distribución portable, necesitamos auth 100% local.

**Cambios en el backend**:

1. **Esquema (Prisma)**:
   - Agregado `password String?` al modelo `User`
   - `clerkId` pasa de `String` a `String?` (opcional)
   - Relación `RepairOrder.technician` ahora referencia `User.id` en vez de `User.clerkId`

2. **Nuevas dependencias**: `bcryptjs` (hash contraseñas), `jsonwebtoken` (JWT)
   - Eliminadas: `@clerk/clerk-sdk-node`, `svix`

3. **Auth middleware** (`backend/src/middleware/auth.js`):
   - `clerkMiddleware` → `authMiddleware`: verifica JWT local con `jsonwebtoken`
   - `requireAuth` y `requireRole` mantienen la misma interfaz

4. **Nuevo controlador** (`backend/src/controllers/authController.js`):
   - `POST /api/auth/login` — login con email + password, devuelve JWT
   - `POST /api/auth/register` — registro del primer usuario (solo si no hay usuarios)
   - `GET /api/auth/me` — datos del usuario autenticado
   - `GET /api/auth/users` — lista de usuarios

5. **Seed** (`backend/prisma/seed.js`):
   - Crea usuario admin por defecto configurable via env vars
   - `SEED_EMAIL`, `SEED_NAME`, `SEED_PASSWORD`
   - Default: `admin@gestortaller.cl` / `admin123`

6. **Limpieza**:
   - Ruta `webhooks.js` simplificada (Clerk ya no aplica)
   - `routes/users.js` simplificada (sin sync con Clerk)
   - `index.js` — removido webhook routes y clerkMiddleware

**Cambios en el frontend**:

1. **Eliminado**: `@clerk/clerk-react`, `ClerkProvider`, `ClerkTokenProvider`, `SignedIn/SignedOut/RedirectToSignIn`, `UserButton`, `useUser`

2. **Nuevo AuthContext** (`frontend/src/context/AuthContext.jsx`):
   - Provee `user`, `loading`, `login()`, `logout()`
   - Al iniciar, verifica si hay token en localStorage y carga el usuario

3. **Nueva página Login** (`frontend/src/pages/Login.jsx`):
   - Formulario simple con email + contraseña
   - Logo de la app centrado

4. **TopBar reemplazado**:
   - `UserButton` de Clerk → avatar con inicial del usuario
   - Menú desplegable con "Cerrar sesión"

5. **App.jsx**:
   - `ProtectedRoute` usa `useAuth()` en vez de `SignedIn/SignedOut`
   - Ruta `/login` pública

6. **main.jsx**:
   - Sin `ClerkProvider`
   - Envuelve con `AuthProvider`

**Archivos modificados**:
- `backend/prisma/schema.prisma` — password, clerkId?, relación id
- `backend/package.json` — bcryptjs + jsonwebtoken, removidos clerk+svix
- `backend/src/index.js` — removido Clerk webhooks y clerkMiddleware
- `backend/src/middleware/auth.js` — authMiddleware con JWT local
- `backend/src/routes/users.js` — sin sync Clerk
- `backend/src/routes/webhooks.js` — simplificado (sin Clerk)
- `backend/.env` — removidas keys de Clerk
- `frontend/package.json` — removido @clerk/clerk-react
- `frontend/.env` — removida VITE_CLERK_PUBLISHABLE_KEY
- `frontend/src/main.jsx` — sin ClerkProvider
- `frontend/src/App.jsx` — login route + ProtectedRoute con AuthContext
- `frontend/src/context/AuthContext.jsx` — nuevo
- `frontend/src/pages/Login.jsx` — nuevo
- `frontend/src/components/layout/TopBar.jsx` — avatar + menú logout
- `frontend/src/lib/auth-token.js` — localStorage nativo

**Archivos eliminados**:
- `frontend/src/components/ClerkTokenProvider.jsx`

---

### 23. Cambio de contraseña y registro desde login

- **Backend**: Nuevo endpoint `PUT /api/auth/password` que recibe `currentPassword` + `newPassword`, verifica la actual y guarda la nueva con hash
- **Frontend Login**: Toggle entre "Iniciar sesión" y "Crear primer usuario". El registro solo funciona si no hay usuarios (el backend ya lo validaba)
- **TopBar**: Opción "Cambiar contraseña" en el menú de usuario que abre un modal con campos de contraseña actual y nueva

**Archivos modificados**:
- `backend/src/controllers/authController.js` — changePassword
- `backend/src/routes/auth.js` — ruta PUT /password
- `frontend/src/lib/api.js` — authApi
- `frontend/src/pages/Login.jsx` — toggle register
- `frontend/src/components/layout/TopBar.jsx` — modal cambio contraseña

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
