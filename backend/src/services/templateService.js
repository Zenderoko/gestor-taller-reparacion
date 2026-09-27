import { prisma } from '../index.js';
import { STATUS_LABELS, EQUIPMENT_TYPES } from '../config/constants.js';
import { AppError } from '../middleware/errorHandler.js';

export const PLACEHOLDERS = [
  { key: 'cliente', label: 'Nombre del cliente' },
  { key: 'orden', label: 'Número de orden' },
  { key: 'estado', label: 'Estado actual' },
  { key: 'estado_anterior', label: 'Estado anterior' },
  { key: 'equipo', label: 'Marca y modelo' },
  { key: 'tipo_equipo', label: 'Tipo de equipo' },
  { key: 'problema', label: 'Problema reportado' },
  { key: 'diagnostico', label: 'Diagnóstico del técnico' },
  { key: 'presupuesto', label: 'Presupuesto estimado' },
  { key: 'costo', label: 'Costo final' },
  { key: 'abono', label: 'Abono pagado' },
  { key: 'saldo', label: 'Saldo pendiente' },
  { key: 'fecha', label: 'Fecha de actualización' },
  { key: 'notas', label: 'Notas de la orden' },
];

const DEFAULT_BODIES = {
  PENDING: [
    '🔧 *TALLER DE REPARACIÓN*',
    '',
    'Hola *{{cliente}}*,',
    '',
    'Recibimos tu equipo *{{equipo}}* con el siguiente problema:',
    '*{{problema}}*',
    '',
    'Orden: *#{{orden}}*',
    'Estado: {{estado}}',
    '',
    'Pronto te confirmaremos el diagnóstico.',
    'Gracias por confiar en nosotros.',
  ],
  DIAGNOSING: [
    '🔧 *TALLER DE REPARACIÓN*',
    '',
    'Hola *{{cliente}}*,',
    '',
    'Tu equipo *{{equipo}}* ya está en diagnóstico (orden *#{{orden}}*).',
    '',
    'Te avisaremos apenas tengamos el resultado y el presupuesto.',
  ],
  IN_PROGRESS: [
    '🔧 *TALLER DE REPARACIÓN*',
    '',
    'Hola *{{cliente}}*,',
    '',
    'Tu equipo *{{equipo}}* ya está en reparación (orden *#{{orden}}*).',
    '',
    'Presupuesto: {{presupuesto}}',
    'Abono: {{abono}}',
    'Saldo: {{saldo}}',
    '',
    'Te avisamos cuando esté listo.',
  ],
  WAITING_PARTS: [
    '🔧 *TALLER DE REPARACIÓN*',
    '',
    'Hola *{{cliente}}*,',
    '',
    'Tu equipo *{{equipo}}* está esperando un repuesto (orden *#{{orden}}*).',
    '',
    'Te avisaremos apenas llegue para continuar con la reparación.',
    'Gracias por tu paciencia.',
  ],
  READY_FOR_PICKUP: [
    '🔧 *TALLER DE REPARACIÓN*',
    '',
    'Hola *{{cliente}}*,',
    '',
    '¡Tu equipo *{{equipo}}* está listo para retirar! 🎉',
    '',
    'Orden: *#{{orden}}*',
    'Costo final: {{costo}}',
    'Saldo pendiente: {{saldo}}',
    '',
    'Te esperamos en el taller.',
  ],
  COMPLETED: [
    '🔧 *TALLER DE REPARACIÓN*',
    '',
    'Hola *{{cliente}}*,',
    '',
    'La reparación de tu equipo *{{equipo}}* quedó completada (orden *#{{orden}}*).',
    '',
    'Costo final: {{costo}}',
    'Saldo pendiente: {{saldo}}',
    '',
    'Cuando quieras retirar tu equipo, avísanos.',
  ],
  DELIVERED: [
    '🔧 *TALLER DE REPARACIÓN*',
    '',
    'Hola *{{cliente}}*,',
    '',
    'Tu equipo *{{equipo}}* fue entregado. ¡Gracias por tu confianza! 🙏',
    '',
    'Orden: *#{{orden}}*',
    'Costo final: {{costo}}',
  ],
  CANCELLED: [
    '🔧 *TALLER DE REPARACIÓN*',
    '',
    'Hola *{{cliente}}*,',
    '',
    'La orden *#{{orden}}* de tu equipo *{{equipo}}* fue cancelada.',
    '',
    'Si fue un error, contáctanos por este medio.',
  ],
};

const DEFAULT_AUTO_SEND = {
  PENDING: false,
  DIAGNOSING: false,
  IN_PROGRESS: true,
  WAITING_PARTS: true,
  READY_FOR_PICKUP: true,
  COMPLETED: true,
  DELIVERED: true,
  CANCELLED: true,
};

const fmt = (n) => `$${Number(n || 0).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function referenceCost(order) {
  return Number(order.totalCost) > 0 ? Number(order.totalCost) : Number(order.estimatedCost);
}

export function buildVariables(order, prevStatus) {
  const cost = referenceCost(order);
  const remaining = cost - Number(order.deposit || 0);

  return {
    cliente: order.client?.name || '',
    orden: order.orderNumber || '',
    estado: STATUS_LABELS[order.status] || order.status || '',
    estado_anterior: prevStatus ? STATUS_LABELS[prevStatus] || prevStatus : '',
    equipo: [order.equipment?.brand, order.equipment?.model].filter(Boolean).join(' '),
    tipo_equipo: EQUIPMENT_TYPES[order.equipment?.type] || order.equipment?.type || '',
    problema: order.reportedIssue || '',
    diagnostico: order.diagnosis || 'Aún sin diagnóstico',
    presupuesto: fmt(order.estimatedCost),
    costo: fmt(order.totalCost),
    abono: fmt(order.deposit),
    saldo: fmt(remaining),
    fecha: new Date(order.updatedAt || Date.now()).toLocaleString('es-CL'),
    notas: order.notes || '',
  };
}

export function renderTemplate(body, order, prevStatus) {
  const vars = buildVariables(order, prevStatus);
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  );
}

export function getSampleOrder(status) {
  return {
    orderNumber: '1042',
    status,
    reportedIssue: 'No enciende, no tiene imagen al enchufar el cargador',
    diagnosis: 'Fonte de poder quemada, se reemplaza el módulo SMPS',
    estimatedCost: 45000,
    totalCost: 52000,
    deposit: 20000,
    notes: 'Traer cargador',
    updatedAt: new Date(),
    client: { name: 'María González', phone: '+56912345678' },
    equipment: { type: 'DESKTOP', brand: 'ASUS', model: 'X550V' },
  };
}

export async function getTemplates() {
  const rows = await prisma.messageTemplate.findMany();
  const saved = Object.fromEntries(rows.map((r) => [r.status, r]));

  return Object.keys(DEFAULT_BODIES).map((status) => {
    const row = saved[status];
    return {
      status,
      label: STATUS_LABELS[status] || status,
      body: row ? row.body : DEFAULT_BODIES[status].join('\n'),
      autoSend: row ? row.autoSend : DEFAULT_AUTO_SEND[status],
      customized: Boolean(row),
    };
  });
}

export async function getTemplate(status) {
  if (!DEFAULT_BODIES[status]) {
    throw new AppError('Estado no válido para plantillas', 400);
  }
  const row = await prisma.messageTemplate.findUnique({ where: { status } });
  return {
    status,
    body: row ? row.body : DEFAULT_BODIES[status].join('\n'),
    autoSend: row ? row.autoSend : DEFAULT_AUTO_SEND[status],
  };
}

export async function updateTemplate(status, { body, autoSend }) {
  if (!DEFAULT_BODIES[status]) {
    throw new AppError('Estado no válido para plantillas', 400);
  }
  if (typeof body !== 'string' || !body.trim()) {
    throw new AppError('El mensaje no puede estar vacío', 400);
  }
  if (body.length > 4096) {
    throw new AppError('El mensaje es demasiado largo (máximo 4096 caracteres)', 400);
  }

  const current = await getTemplate(status);
  const data = {
    body: body.trim(),
    autoSend: autoSend === undefined ? current.autoSend : Boolean(autoSend),
  };

  const row = await prisma.messageTemplate.upsert({
    where: { status },
    create: { status, ...data },
    update: data,
  });

  return { status: row.status, body: row.body, autoSend: row.autoSend, customized: true };
}
