export const REPAIR_STATUS = {
  PENDING: 'PENDING',
  DIAGNOSING: 'DIAGNOSING',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_PARTS: 'WAITING_PARTS',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_LABELS = {
  PENDING: 'Pendiente',
  DIAGNOSING: 'Diagnosticando',
  IN_PROGRESS: 'En reparación',
  WAITING_PARTS: 'Esperando piezas',
  READY_FOR_PICKUP: 'Listo para retirar',
  COMPLETED: 'Completado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

export const PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const EQUIPMENT_TYPES = {
  LAPTOP: 'Laptop',
  DESKTOP: 'Desktop',
  SMARTPHONE: 'Smartphone',
  TABLET: 'Tablet',
  CONSOLE: 'Consola',
  PRINTER: 'Impresora',
  MONITOR: 'Monitor',
  AUDIO: 'Audio',
  OTHER: 'Otro',
};

export const STATUS_TRANSITIONS = {
  PENDING: ['DIAGNOSING', 'CANCELLED'],
  DIAGNOSING: ['IN_PROGRESS', 'WAITING_PARTS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'READY_FOR_PICKUP', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};
