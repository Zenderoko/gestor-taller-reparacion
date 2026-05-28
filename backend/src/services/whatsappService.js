import wppconnect from '@wppconnect-team/wppconnect';
import { logger } from '../config/logger.js';

let client = null;
let qrCodeBase64 = null;
let connectionStatus = 'disconnected';
let connectResolve = null;
let connectReject = null;
let connectPromise = null;

export function getStatus() {
  return { status: connectionStatus, qr: qrCodeBase64 };
}

export async function startConnection() {
  if (client) return { status: 'connected' };
  if (connectPromise) return { status: connectionStatus, qr: qrCodeBase64 };

  connectionStatus = 'qr';
  qrCodeBase64 = null;

  connectPromise = new Promise((resolve, reject) => {
    connectResolve = resolve;
    connectReject = reject;
  });

  wppconnect.create({
    session: 'gestor-taller',
    headless: true,
    autoClose: false,
    logQR: false,
    catchQR: (base64) => {
      qrCodeBase64 = base64;
      connectionStatus = 'qr';
      logger.info('WhatsApp: QR generado');
    },
    statusFind: (status) => {
      if (status === 'isLogged') {
        connectionStatus = 'connected';
        qrCodeBase64 = null;
      }
    },
    onLoadingScreen: (percent, message) => {
      logger.debug('WhatsApp: Cargando', { percent, message });
    },
  }).then((whatsapp) => {
    client = whatsapp;
    connectionStatus = 'connected';
    qrCodeBase64 = null;
    logger.info('WhatsApp: Cliente listo');

    client.onStateChange((state) => {
      if (state === 'DISCONNECTED' || state === 'SYNCING') {
        connectionStatus = 'disconnected';
        client = null;
        connectPromise = null;
        qrCodeBase64 = null;
        logger.warn('WhatsApp: Desconectado');
      }
    });

    if (connectResolve) connectResolve(client);
  }).catch((err) => {
    connectionStatus = 'error';
    connectPromise = null;
    logger.error('WhatsApp: Error al inicializar', { error: err.message });
  });

  return { status: connectionStatus, qr: qrCodeBase64 };
}

export async function sendMessage(to, message) {
  try {
    if (!client) {
      await startConnection();
      if (!connectPromise) {
        return { success: false, error: 'WhatsApp no conectado' };
      }
      const timeout = setTimeout(() => {
        if (connectReject) connectReject(new Error('Timeout'));
      }, 30000);
      try {
        client = await connectPromise;
      } finally {
        clearTimeout(timeout);
      }
    }

    let number = to.replace(/[^0-9]/g, '');
    if (!number.startsWith('56')) {
      number = '56' + number;
    }

    const result = await client.sendText(`${number}@c.us`, message);
    logger.info('WhatsApp enviado', { to: number });
    return { success: true, id: result.id };
  } catch (err) {
    const msg = err?.message || '';
    logger.error('Error enviando WhatsApp', { error: msg, to });
    if (msg.includes('cannot send to same') || msg.length < 10) {
      return { success: false, error: '¿Estás intentando enviarte un mensaje a ti mismo? WhatsApp no permite enviar notificaciones al mismo número conectado. Usa un número de cliente distinto.' };
    }
    return { success: false, error: msg || 'Error al enviar WhatsApp' };
  }
}

export function orderStatusMessage(order) {
  const statusLabels = {
    PENDING: 'Pendiente',
    DIAGNOSING: 'Diagnosticando',
    IN_PROGRESS: 'En reparación',
    WAITING_PARTS: 'Esperando piezas',
    READY_FOR_PICKUP: 'Listo para retirar',
    COMPLETED: 'Completado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  };

  const lines = [
    '🔧 *TALLER DE REPARACIÓN*',
    '',
    `Hola *${order.client.name}*,`,
    '',
    `Tu orden *#${order.orderNumber}* ha cambiado de estado:`,
    '',
    `📌 *Estado:* ${statusLabels[order.status] || order.status}`,
    ``,
    `Equipo: ${order.equipment.brand} ${order.equipment.model}`,
    '',
    'Gracias por confiar en nosotros.',
  ];

  return lines.join('\n');
}
