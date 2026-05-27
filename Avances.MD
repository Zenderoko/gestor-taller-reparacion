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

### Pendientes / Próximos pasos

- **WhatsApp — número dedicado para el taller**: Usar un chip prepago solo para el taller, instalar WhatsApp en un celular viejo y escanear el QR con ese número. Así los mensajes salen del número del taller, no del personal.
- **WhatsApp Business API**: Alternativa más profesional con hasta 1000 mensajes gratis al mes vía Meta, requiere verificación de empresa.
- Pasar a producción (cambiar keys de desarrollo a producción en Clerk)
