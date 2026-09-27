import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { createAuditLog } from '../utils/audit.js';
import { sendMessage } from '../services/whatsappService.js';
import { getTemplate, renderTemplate } from '../services/templateService.js';
import { generateRepairOrderPDF } from '../services/pdfService.js';
import { STATUS_LABELS } from '../config/constants.js';

export async function list(req, res, next) {
  try {
    const { status, clientId, priority, search, startDate, endDate, showArchived, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (showArchived !== 'true') where.archived = false;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (priority) where.priority = priority;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { reportedIssue: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.repairOrder.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          equipment: { select: { id: true, type: true, brand: true, model: true } },
          statusHistory: { take: 1, orderBy: { createdAt: 'desc' } },
          _count: { select: { statusHistory: true, payments: true } },
        },
      }),
      prisma.repairOrder.count({ where }),
    ]);

    res.json({ data: orders, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const order = await prisma.repairOrder.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        equipment: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new AppError('Orden no encontrada', 404);
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    let { clientId, equipmentId, reportedIssue, priority, estimatedCost, notes } = req.body;
    estimatedCost = estimatedCost !== undefined && estimatedCost !== '' ? Number(estimatedCost) : 0;

    const [client, equipment] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.equipment.findUnique({ where: { id: equipmentId } }),
    ]);
    if (!client) throw new AppError('Cliente no encontrado', 404);
    if (!equipment) throw new AppError('Equipo no encontrado', 404);

    const orderNumber = await generateOrderNumber();

    const order = await prisma.repairOrder.create({
      data: {
        orderNumber,
        clientId,
        equipmentId,
        reportedIssue,
        priority: priority || 'MEDIUM',
        estimatedCost: estimatedCost || 0,
        notes,
        statusHistory: {
          create: { status: 'PENDING', note: 'Orden creada', createdBy: req.auth.userId },
        },
      },
      include: { client: true, equipment: true, statusHistory: true },
    });

    await createAuditLog({ action: 'CREATE', entity: 'RepairOrder', entityId: order.id, userId: req.auth.userId });

    res.status(201).json({ data: order });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await prisma.repairOrder.findUnique({ where: { id } });
    if (!order) throw new AppError('Orden no encontrada', 404);

    const updateData = { status };
    if (status === 'IN_PROGRESS' && !order.startDate) updateData.startDate = new Date();
    if (status === 'COMPLETED') updateData.completedDate = new Date();

    const [updated] = await Promise.all([
      prisma.repairOrder.update({
        where: { id },
        data: {
          ...updateData,
          statusHistory: {
            create: { status, note: note || `Estado cambiado a ${STATUS_LABELS[status] || status}`, createdBy: req.auth.userId },
          },
        },
        include: { client: true, equipment: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
      }),
    ]);

    let whatsappSent = false;
    if (updated.client?.phone) {
      const template = await getTemplate(status);
      if (template.autoSend) {
        const message = renderTemplate(template.body, updated, order.status);
        const result = await sendMessage(updated.client.phone, message);
        whatsappSent = Boolean(result.success);
      }
    }

    res.json({ data: updated, whatsappSent });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    let { diagnosis, totalCost, deposit, estimatedCost, internalNotes, notes, assignedTo, priority } = req.body;
    const current = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });

    const toNumber = (v) => (v === undefined || v === null || v === '') ? undefined : Number(v);
    totalCost = toNumber(totalCost);
    deposit = toNumber(deposit);
    estimatedCost = toNumber(estimatedCost);

    const data = { diagnosis, totalCost, deposit, estimatedCost, internalNotes, notes, assignedTo, priority };
    const order = await prisma.repairOrder.update({
      where: { id: req.params.id },
      data,
    });

    if (deposit !== undefined && current) {
      const diff = Number(deposit) - Number(current.deposit);
      if (diff > 0) {
        await prisma.payment.create({
          data: {
            repairOrderId: req.params.id,
            amount: diff,
            method: 'AJUSTE',
            note: 'Ajuste desde edición de orden',
          },
        });
      }
    }

    res.json({ data: order });
  } catch (err) {
    next(err);
  }
}

export async function addPayment(req, res, next) {
  try {
    const { id } = req.params;
    let { amount, method, reference, note } = req.body;
    amount = Number(amount);

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: { repairOrderId: id, amount, method, reference, note },
      }),
      prisma.repairOrder.update({
        where: { id },
        data: { deposit: { increment: amount } },
      }),
    ]);

    res.status(201).json({ data: payment });
  } catch (err) {
    next(err);
  }
}

export async function previewWhatsApp(req, res, next) {
  try {
    const order = await prisma.repairOrder.findUnique({
      where: { id: req.params.id },
      include: { client: true, equipment: true },
    });
    if (!order) throw new AppError('Orden no encontrada', 404);

    const status = req.query.status || order.status;
    const template = await getTemplate(status);
    const previous = await prisma.statusHistory.findFirst({
      where: { repairOrderId: order.id },
      orderBy: { createdAt: 'desc' },
      skip: 1,
    });

    res.json({
      data: {
        status,
        to: order.client?.phone || '',
        autoSend: template.autoSend,
        rendered: renderTemplate(template.body, { ...order, status }, previous?.status),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function sendWhatsApp(req, res, next) {
  try {
    const order = await prisma.repairOrder.findUnique({
      where: { id: req.params.id },
      include: { client: true, equipment: true },
    });
    if (!order) throw new AppError('Orden no encontrada', 404);

    const to = order.client.phone;
    if (!to) throw new AppError('El cliente no tiene teléfono registrado', 400);

    const custom = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const template = await getTemplate(order.status);
    const message = custom || renderTemplate(template.body, order);

    if (!message) throw new AppError('El mensaje está vacío', 400);

    const result = await sendMessage(to, message);

    if (!result.success) {
      throw new AppError(result.error || 'Error al enviar WhatsApp', 500);
    }

    res.json({ success: true, id: result.id, sent: message });
  } catch (err) {
    next(err);
  }
}

export async function downloadPdf(req, res, next) {
  try {
    const order = await prisma.repairOrder.findUnique({
      where: { id: req.params.id },
      include: { client: true, equipment: true },
    });
    if (!order) throw new AppError('Orden no encontrada', 404);

    const pdfBuffer = await generateRepairOrderPDF(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="orden-${order.orderNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const order = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Orden no encontrada', 404);

    await prisma.repairOrder.delete({ where: { id: req.params.id } });
    await createAuditLog({ action: 'DELETE', entity: 'RepairOrder', entityId: req.params.id, userId: req.auth.userId });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function archive(req, res, next) {
  try {
    const order = await prisma.repairOrder.update({
      where: { id: req.params.id },
      data: { archived: true, archivedAt: new Date() },
    });
    await createAuditLog({ action: 'ARCHIVE', entity: 'RepairOrder', entityId: order.id, userId: req.auth.userId });
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
}

export async function unarchive(req, res, next) {
  try {
    const order = await prisma.repairOrder.update({
      where: { id: req.params.id },
      data: { archived: false, archivedAt: null },
    });
    await createAuditLog({ action: 'UNARCHIVE', entity: 'RepairOrder', entityId: order.id, userId: req.auth.userId });
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
}
