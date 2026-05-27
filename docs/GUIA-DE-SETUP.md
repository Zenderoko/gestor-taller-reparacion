# Guía de Setup - GestorTaller

## Requisitos previos

- Node.js 18+ (https://nodejs.org)
- Git (https://git-scm.com)
- PostgreSQL (ver opciones abajo)
- Una cuenta gratis en Clerk (https://clerk.com)

---

## 1. PostgreSQL - Base de datos

### Opción A: Instalación local (recomendado para desarrollo)

1. Descargar PostgreSQL: https://www.postgresql.org/download/
2. Instalar y recordar el usuario y contraseña que elegiste
3. Abrir terminal y crear la base de datos:

```bash
# Windows (cmd como administrador)
"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres -c "CREATE DATABASE gestor_taller;"

# O entrar al psql interactive:
"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres
# Dentro de psql:
CREATE DATABASE gestor_taller;
\q
```

4. Tu DATABASE_URL será:
```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/gestor_taller?schema=public"
```

### Opción B: Neon (cloud, gratuito - sin instalación)

1. Ir a https://console.neon.tech/signup
2. Registrarse con GitHub
3. Crear un nuevo proyecto (región la más cercana)
4. Copiar la connection string que termina en `?sslmode=require`
5. Se ve así:
```env
DATABASE_URL="postgresql://usuario:password@ep-xxxx.us-east-2.aws.neon.tech/gestor_taller?sslmode=require"
```

### Opción C: Supabase (cloud, gratuito)

1. Ir a https://supabase.com
2. Crear cuenta y nuevo proyecto
3. En Settings > Database copiar "Connection string" (URI)
4. Misma estructura que Neon

### Opción D: Railway (cloud, gratuito con límites)

1. Ir a https://railway.new
2. Crear cuenta con GitHub
3. New Project > Provision PostgreSQL
4. Copiar DATABASE_URL de las variables de entorno

---

## 2. Clerk - Autenticación

1. Ir a https://dashboard.clerk.com
2. Sign up (gratuito)
3. Crear nueva aplicación:
   - Name: `gestor-taller`
   - Sign in: elegir Email + Google (o el que quieras)
4. En la página "API Keys" copiar:

```env
# Backend (.env)
CLERK_SECRET_KEY="sk_test_..."

# Frontend (.env)
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

5. Configurar Webhook (para sincronizar usuarios):
   - En el dashboard de Clerk: Webhooks > Add Endpoint
   - Endpoint URL: `http://localhost:3001/api/webhooks/clerk`
   - Events a escuchar: `user.created`, `user.updated`, `user.deleted`
   - Copiar "Signing Secret":
```env
CLERK_WEBHOOK_SECRET="whsec_..."
```

6. Configurar Clerk en producción (cuando tengas dominio):
   - En Clerk > User & Authentication > Email, SMS & Social
   - Agregar "Redirect URLs" con tu dominio real

---

## 3. Backend - Setup

```bash
# Ir a la carpeta
cd gestor-taller/backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env
```

Editar `backend/.env` con tus valores reales:

```env
# Base de datos (elegí la opción que usaste)
DATABASE_URL="postgresql://postgres:1234@localhost:5432/gestor_taller?schema=public"

# Clerk
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# WhatsApp (opcional - podes dejarlo vacío)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_NUMBER=""

# URL base
APP_URL="http://localhost:5173"
```

### Migrar base de datos:

```bash
# Crea las tablas en PostgreSQL
npx prisma migrate dev --name init

# Ver la base de datos en el navegador (opcional)
npx prisma studio
```

### Iniciar servidor:

```bash
npm run dev
# Deberías ver: "Servidor corriendo en puerto 3001"
```

Probar que funciona:
```bash
# En otra terminal
curl http://localhost:3001/api/health
# Respuesta esperada: {"status":"ok","timestamp":"..."}
```

---

## 4. Frontend - Setup

```bash
# Ir a la carpeta
cd gestor-taller/frontend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env
```

Editar `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_API_URL=http://localhost:3001/api
```

### Iniciar frontend:

```bash
npm run dev
# Abrir http://localhost:5173
```

### Probar login:
1. Ir a http://localhost:5173
2. Te debería redirigir a la página de login de Clerk
3. Registrarte con email o Google
4. Una vez logueado, ves el dashboard

---

## 5. Crear primer usuario administrador

Por defecto todos los usuarios se crean como "RECEPTIONIST".
Para hacerte Admin:

### Opción A: Desde Clerk Dashboard
1. Ir a Clerk Dashboard > Users
2. Buscar tu usuario
3. En "Public metadata" agregar:
```json
{"role": "ADMIN"}
```

### Opción B: Directo en base de datos
```bash
npx prisma studio
# Buscar la tabla User y editar el role a ADMIN
```

---

## 6. WhatsApp (opcional - SIN costo)

Usa `@wppconnect-team/wppconnect` que se conecta a WhatsApp Web real.
No requiere cuentas ni pagos.

1. Inicia el backend y frontend
2. Ve a la sección **WhatsApp** en el menú lateral
3. Presiona **"Conectar WhatsApp"**
4. Escanea el QR con tu teléfono (WhatsApp → Menú → WhatsApp Web)
5. Listo. Los cambios de estado en órdenes notificarán automáticamente al cliente

> 💡 Para que los mensajes salgan de un **número del taller** (no tu número personal):
> - Consigue un chip prepago solo para el taller
> - Instala WhatsApp en un celular viejo con ese número
> - Escanea el QR desde la página de WhatsApp con ese celular

---

## 7. Comandos útiles

```bash
# Backend
npm run dev          # Iniciar servidor en modo desarrollo
npm run db:migrate   # Ejecutar migraciones de Prisma
npm run db:studio    # Abrir Prisma Studio (navegador BD)
npm run db:seed      # Poblar base de datos con datos de prueba

# Frontend
npm run dev          # Iniciar en modo desarrollo
npm run build        # Compilar para producción
npm run preview      # Vista previa de producción

# Ambos (desde raíz del proyecto - si tenés las dos terminales abiertas)
# Terminal 1: backend
cd backend && npm run dev

# Terminal 2: frontend
cd frontend && npm run dev
```

---

## 8. Solución de problemas comunes

### "ECONNREFUSED ::1:5432"
PostgreSQL no está corriendo. Iniciar el servicio:
- Windows: `net start postgresql-x64-16`
- O desde Services.msc

### "relation does not exist"
Olvidaste correr las migraciones:
```bash
cd backend && npx prisma migrate dev
```

### "Clerk: no session"
El token no se está enviando. Verificar:
- Que `VITE_CLERK_PUBLISHABLE_KEY` esté bien en el frontend
- Que `CLERK_SECRET_KEY` esté bien en el backend
- Hacer logout y login de nuevo

### CORS errors
Verificar en `backend/.env` que `FRONTEND_URL` coincida con la URL del frontend:
```env
FRONTEND_URL="http://localhost:5173"
```

### Puerto ocupado
Cambiar el puerto en backend:
```env
PORT=3002
```
Y actualizar el proxy en `frontend/vite.config.js` apuntando a `http://localhost:3002`.

---

## 9. Producción (para cuando subas el proyecto)

### Backend:
- Usar `NODE_ENV=production`
- Deshabilitar `morgan` (o usar modo combined)
- Usar PostgreSQL en producción (Neon, Railway, AWS RDS)
- Configurar CORS con tu dominio real

### Frontend:
```bash
cd frontend
npm run build
# Los archivos estáticos quedan en frontend/dist/
# Servir con Nginx, Vercel, Netlify o Railway
```

### Recomendación fácil para deploy:
- Backend: **Railway** o **Render** (conectan directo con GitHub)
- Frontend: **Vercel** (conectás el repo y autodeploy)
- BD: **Neon** (gratuito, serverless PostgreSQL)
- Auth: **Clerk** (ya está en cloud)

---

## Checklist final

- [ ] PostgreSQL instalado / cloud conectado
- [ ] Base de datos "gestor_taller" creada
- [ ] Cuenta en Clerk creada
- [ ] API keys de Clerk copiadas
- [ ] Webhook de Clerk configurado
- [ ] `backend/.env` completo
- [ ] `frontend/.env` completo
- [ ] `npm install` en backend y frontend
- [ ] `npx prisma migrate dev` ejecutado sin errores
- [ ] Backend corriendo en `localhost:3001`
- [ ] Frontend corriendo en `localhost:5173`
- [ ] Login funcionando con Clerk
- [ ] Dashboard cargando datos
- [ ] (Opcional) WhatsApp conectado vía QR
