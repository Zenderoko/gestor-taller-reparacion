# Roadmap - GestorTaller SaaS

> Última revisión: 27/09/2026 — contrastado contra el código (backend + frontend).

## Fase 1: MVP ✅
- [x] Gestión de clientes (CRUD + búsqueda)
- [x] Gestión de equipos (registro por cliente)
- [x] Órdenes de reparación (creación + flujo de estados)
- [x] Estados de reparación (transiciones válidas)
- [x] Historial de cambios por orden (`StatusHistory`)
- [x] Dashboard administrativo (métricas clave)
- [x] Autenticación — **JWT local** (bcrypt + jsonwebtoken), Clerk fue reemplazado
- [x] Roles de usuario (Admin, Técnico, Recepcionista) — campo `role` en `User` + `requireRole` en middleware
- [x] UI responsive (TailwindCSS)

## Fase 2: Comunicación y Documentos
- [x] Generación de PDF (orden de reparación) — `pdfService.js` (pdfkit), `GET /api/orders/:id/pdf`, botón "Imprimir PDF"
- [x] Envío de WhatsApp (cambio de estado, notificaciones) — wppconnect, envío automático al cambiar estado, envío manual desde la orden, página `/whatsapp` con QR en vivo
- [x] Template de mensajes personalizables — un mensaje por estado, editables en `/whatsapp`, con variables (`{{cliente}}`, `{{saldo}}`…), vista previa y switch de envío automático por estado
- [ ] Envío de email (resumen, factura)
- [ ] Historial de comunicaciones — falta modelo `CommunicationLog`

## Fase 3: Pagos y Facturación
- [x] Registro de pagos — `POST /api/orders/:id/payments`, modelo `Payment`, métodos Efectivo/Transferencia, saldo restante (`presupuesto - abono`)
- [ ] Método de pago Tarjeta
- [ ] Integración con Mercado Pago / Stripe
- [ ] Factura electrónica (AFIP/ARSAT)
- [ ] Control de caja diaria
- [ ] Reportes de ingresos — el dashboard solo muestra ingresos del mes; falta módulo de reportes

## Fase 4: Inventario
- [ ] Gestión de stock de repuestos
- [ ] Proveedores
- [ ] Alertas de stock bajo
- [ ] Asignación de piezas a órdenes
- [ ] Historial de compras

## Fase 5: API y Mobile
- [ ] API pública (documentación OpenAPI) — hay una tabla de endpoints en el README, no OpenAPI
- [ ] Webhooks para integraciones externas — `routes/webhooks.js` es un stub de Clerk, sin montar en `index.js`
- [ ] App móvil (React Native)
- [ ] Notificaciones push
- [ ] Escaneo de QR en órdenes — el QR actual es solo para conectar WhatsApp

## Fase 6: Multi-sucursal y Escalabilidad
- [ ] Soporte multi-sucursal — existe `businessId` en `User` pero no se usa para aislar datos
- [ ] Dashboard comparativo entre sucursales
- [ ] Roles y permisos granulares — el rol se guarda pero `requireRole` no se aplica en ninguna ruta
- [~] Logs de auditoría — `AuditLog` + `createAuditLog()` en clientes y órdenes; falta cobertura total y pantalla de consulta
- [ ] Backup automático

## Fase 7: Reportes Avanzados
- [ ] Reportes personalizables
- [ ] Exportación a Excel/CSV
- [ ] Gráficos avanzados (tiempos, productividad) — solo hay gráfico de distribución por estado
- [ ] IA para diagnóstico predictivo
- [ ] SLAs y métricas de calidad
