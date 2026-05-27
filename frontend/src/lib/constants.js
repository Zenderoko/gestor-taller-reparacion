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

export const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  DIAGNOSING: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  READY_FOR_PICKUP: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export const EQUIPMENT_TYPES = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Desktop' },
  { value: 'SMARTPHONE', label: 'Smartphone' },
  { value: 'TABLET', label: 'Tablet' },
  { value: 'CONSOLE', label: 'Consola' },
  { value: 'PRINTER', label: 'Impresora' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'OTHER', label: 'Otro' },
];

export const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];
