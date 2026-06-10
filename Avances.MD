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

### 3. Prevención de clientes duplicados por RUT

- Agregado `@unique` al campo `documentId` en `backend/prisma/schema.prisma`
- Agregada validación en `create()` y `update()` de `clientController.js`
- Ejecutado `prisma db push --accept-data-loss`

### 4. Corrección de foreign key en createdBy

**Problema**: Al crear cliente, error `Foreign key constraint violated` porque el webhook de Clerk no estaba configurado y el usuario no existía en la BD local.

**Solución**: Eliminada la relación foránea entre `Client.createdBy` y `User.clerkId`. `createdBy` queda como string simple.

### 5. Refresco automático de lista de clientes

- Agregado `queryClient.invalidateQueries({ queryKey: ['clients'] })` después de crear un cliente

### 6. Dashboard - Texto completo en tarjetas

- Eliminada clase `truncate` de las etiquetas en StatCard para que se vea el texto completo

### 7. Edición de datos (UPDATE)

Agregados modales de edición para las tres entidades principales:

**Clientes** (`ClientDetail.jsx`):
- Botón "Editar" en la vista de detalle
- Modal con campos: nombre, teléfono, email, documento, dirección, notas

**Órdenes** (`OrderDetail.jsx`):
- Botón "Editar orden" en sección de acciones
- Modal con: presupuesto, total, abono, prioridad, diagnóstico, notas, notas internas
- Agregado `estimatedCost` al controlador `update()` del backend

**Equipos** (`Equipment.jsx`):
- Icono de lápiz por cada fila para editar
- Modal con todos los campos: cliente, tipo, marca, modelo, serie, contraseña, accesorios, estado físico, notas

### 8. Formato CLP (Peso Chileno) sin decimales

- Cambiada función `formatCurrency()` en `frontend/src/lib/utils.js` de `es-AR`/`ARS` a `es-CL`/`CLP` con 0 decimales

### 9. Tooltips en sidebar colapsada

- Agregado tooltip oscuro al hacer hover sobre iconos de la barra lateral cuando está colapsada

### 10. Corrección pagos (abono) y saldo restante

- Cambiado `remaining` a `estimatedCost - deposit` (presupuesto - abono)
- Eliminado `Math.max(0, ...)` para mostrar valores reales (negativo = saldo a favor)
- `addPayment` ahora usa `prisma.$transaction` con `deposit: { increment: amount }`
- Al editar una orden, si el `deposit` aumentó, se crea automáticamente un `Payment` con la diferencia
- Botón "Registrar pago" se deshabilita si el abono ya cubre el presupuesto

### 11. Dashboard - Ingresos del mes corregido

**Problema**: "Ingresos del mes" siempre mostraba $0.
**Solución**: Ahora suma `Payment.amount` de los pagos registrados en el mes.

### 12. Dashboard - Nueva tarjeta "Total de las órdenes"

- Reemplazada tarjeta "Total órdenes" (contador) por "Total de las órdenes" que muestra la suma de `totalCost` de todas las órdenes

### 13. Renombres en UI

- "Presupuesto" → "Presupuesto estimado"
- "Total" → "Costo final"

### 14. Webhook Clerk — corrección de firma Svix + sincronización

**Problema**: El webhook usaba `JSON.stringify(req.body)` para verificar la firma, pero Svix necesita el body raw original.

**Soluciones**:
- Movido `express.raw({ type: 'application/json' })` antes del parseo JSON global
- Cambiado `wh.verify(JSON.stringify(req.body), ...)` por `wh.verify(req.body, ...)`
- Agregado `syncUserFromClerk()` en `GET /users/me` como fallback

### 15. WhatsApp con wppconnect (reemplazo de Twilio)

**Problema**: Twilio Sandbox gratuito solo permite enviar a 1 número previa activación.

**Solución**: Reemplazado Twilio por `@wppconnect-team/wppconnect`. Conecta con WhatsApp Web real, sin límite de números ni costos recurrentes.

- Creado servicio `whatsappService.js` con reconexión y `catchQR`
- Agregado `POST /api/orders/:id/whatsapp` — envía manual desde detalle de orden
- Envío automático al cambiar estado de una orden
- Página `/whatsapp` con QR en vivo (polling cada 3s)

### 16. Generación de PDFs

- Corregido `pdfService.js` para usar formato CLP y locale `es-CL`
- Agregado `GET /api/orders/:id/pdf` — descarga PDF de la orden
- Botón "Imprimir PDF" en `OrderDetail.jsx`

### 17. Búsqueda avanzada y filtros

**Órdenes**: Filtro por prioridad + rango de fechas
**Equipos**: Filtro por tipo de equipo

### 18. Archivar / Eliminar clientes, equipos y órdenes

- Implementado sistema de archivado (soft-delete) + eliminación permanente
- Agregados campos `archived` y `archivedAt` a Client, Equipment y RepairOrder
- Listas filtran `archived: false` por defecto. Toggle para ver archivados
- Botones Archivar/Restaurar/Eliminar con confirmación

### 19. Tooltips en botones de equipos

- Agregados tooltips al hacer hover sobre los iconos de editar, archivar/restaurar y eliminar en la tabla de equipos

### 20. Botón eliminar en detalle de orden

- Agregado `ordersApi.delete` y botón "Eliminar orden" con confirmación en OrderDetail

### 21. Diseño responsive

- Sidebar overlay deslizable en móvil con botón hamburguesa
- TopBar con fecha abreviada y email oculto en móvil
- Pagination con texto responsive
- RecentOrdersTable con `overflow-x-auto`
- WhatsApp QR responsivo (`w-48 sm:w-64`)
- Card padding responsivo (`p-4 sm:p-6`)

### 22. Autenticación local (reemplazo de Clerk)

**Cambios**:
- `password` en User model, `clerkId` opcional, relación `RepairOrder.technician` por `id`
- Backend: `bcryptjs` + `jsonwebtoken`. Eliminados `@clerk/clerk-sdk-node` y `svix`
- Auth middleware verifica JWT local
- `POST /api/auth/login`, `POST /api/auth/register` (solo primer usuario), `GET /api/auth/me`
- Frontend: `AuthContext`, página `Login.jsx`, avatar con inicial + menú logout
- Eliminados `ClerkProvider`, `UserButton`, `ClerkTokenProvider`
- Seed: `admin@gestortaller.cl` / `admin123`

### 23. Cambio de contraseña y registro desde login

- `PUT /api/auth/password` con validación de contraseña actual
- Login page con toggle entre login y registro de primer usuario
- TopBar: opción "Cambiar contraseña" con modal
- Input: ojo toggle (`Eye`/`EyeOff`) en todos los campos password
- Modal cambio contraseña: campo "Confirmar nueva contraseña"

### 24. Migración de PostgreSQL a SQLite

**Motivación**: Cada instalación necesita su propia base de datos. SQLite es un solo archivo, cero configuración.

**Cambios**:
- `provider` cambiado de `postgresql` a `sqlite`
- Enums → `String` (SQLite no soporta enums)
- `Decimal` → `Float`
- Eliminado `mode: 'insensitive'` (SQLite es case-insensitive por defecto)
- `DATABASE_URL` → `file:./dev.db`

---

### Pendientes / Próximos pasos

- **Empaquetado portable (.exe o script)**: Empaquetar con Node.js portable para que funcione con doble clic sin instalar nada
- **Multi-tenencia**: Aislamiento de datos por negocio/taller
- **WhatsApp — número dedicado**: Usar un chip prepago solo para el taller

---

### Cómo instalar en un PC nuevo (desarrollo)

Requisito: **Solo Node.js** (no necesita PostgreSQL ni Clerk)

```bash
# 1. Clonar
git clone <repo-url>
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

Cada PC tiene su propio archivo SQLite (`backend/prisma/dev.db`), los datos nunca se mezclan entre instalaciones.

---

### Cómo instalar en un PC nuevo (producción)

Un solo comando:

```bash
git clone <repo-url>
cd gestor-taller-reparacion
npm run setup
```

Esto ejecuta: instalar dependencias backend, crear DB SQLite, ejecutar seed, instalar dependencias frontend y construir.

Luego editar `backend/.env`:

```env
NODE_ENV=production
JWT_SECRET=clave-segura-aleatoria        # cambiar obligatoriamente
APP_URL=http://IP-DEL-PC:3001           # IP del servidor
```

Iniciar:

```bash
npm start
```

Acceder desde cualquier equipo de la red: `http://IP-DEL-PC:3001`

---

### Cómo desplegar en un NAS (producción)

El NAS corre el backend y sirve el frontend. Otros equipos acceden solo con el navegador.

```bash
# 1. Clonar en el NAS
cd /ruta/en/el/nas
git clone <repo-url>
cd gestor-taller-reparacion

# 2. Setup completo (una sola vez)
npm run setup

# 3. Editar backend/.env
#   NODE_ENV=production
#   JWT_SECRET=contraseña-segura-aleatoria
#   APP_URL=http://192.168.1.100:3001   (IP del NAS)

# 4. Iniciar
npm start
```

**Acceso desde cualquier PC de la red**: `http://192.168.1.100:3001`

**Ventajas**:
- Un solo proceso (backend), no hay que correr frontend aparte
- La base de datos SQLite queda en el NAS, accesible solo desde ahí
- Cada equipo de la red accede con el navegador, sin instalar nada
- Los datos están centralizados y seguros en el NAS

---

### Auto-inicio al encender el NAS

**Opción A — PM2 (recomendado)**

```bash
# En el NAS, una sola vez
npm install -g pm2
cd gestor-taller-reparacion
pm2 start ecosystem.config.js
pm2 startup    # genera script de arranque automático
pm2 save       # guarda la lista de procesos
```

A partir de ahora, cada vez que el NAS se reinicie, PM2 arranca el backend automáticamente.

**Opción B — Script de inicio**

Si el NAS no tiene PM2 o prefieres usar la tarea programada del NAS:

1. Editar `backend/.env` y poner `NODE_ENV=production`
2. Agregar `start.sh` como tarea de inicio en el NAS:
   - **Synology**: Panel de control → Tarea programada → Crear → Activada al arranque
   - **QNAP**: App Center → Script automático
   - **Linux genérico**: `/etc/rc.local` o systemd

```bash
# Ejemplo de tarea programada en Synology
bash /ruta/a/gestor-taller-reparacion/start.sh
```

**Archivos creados**:
- `package.json` — script `setup` y `start` en la raíz
- `ecosystem.config.js` — configuración PM2
- `start.sh` — script de inicio para tareas programadas
