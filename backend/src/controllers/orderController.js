import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { createAuditLog } from '../utils/audit.js';
import { STATUS_TRANSITIONS } from '../config/constants.js';
import { sendMessage, orderStatusMessage } from '../services/whatsappService.js';
import { generateRepairOrderPDF } from '../services/pdfService.js';

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
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { reportedIssue: { contains: search, mode: 'insensitive' } },
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
    const { clientId, equipmentId, reportedIssue, priority, estimatedCost, notes } = req.body;

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

    const validTransitions = STATUS_TRANSITIONS[order.status];
    if (!validTransitions.includes(status)) {
      throw new AppError(
        `Transición inválida de ${order.status} a ${status}`,
        400
      );
    }

    const updateData = { status };
    if (status === 'IN_PROGRESS' && !order.startDate) updateData.startDate = new Date();
    if (status === 'COMPLETED') updateData.completedDate = new Date();

    const [updated] = await Promise.all([
      prisma.repairOrder.update({
        where: { id },
        data: {
          ...updateData,
          statusHistory: {
            create: { status, note: note || `Estado cambiado a ${status}`, createdBy: req.auth.userId },
          },
        },
        include: { client: true, equipment: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
      }),
    ]);

    if (updated.client?.phone) {
      const message = orderStatusMessage(updated);
      sendMessage(updated.client.phone, message);
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { diagnosis, totalCost, deposit, estimatedCost, internalNotes, notes, assignedTo, priority } = req.body;
    const current = await prisma.repairOrder.findUnique({ where: { id: req.params.id } });

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
    const { amount, method, reference, note } = req.body;

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

export async function sendWhatsApp(req, res, next) {
  try {
    const order = await prisma.repairOrder.findUnique({
      where: { id: req.params.id },
      include: { client: true, equipment: true },
    });
    if (!order) throw new AppError('Orden no encontrada', 404);

    const to = order.client.phone;
    if (!to) throw new AppError('El cliente no tiene teléfono registrado', 400);

    const message = orderStatusMessage(order);
    const result = await sendMessage(to, message);

    if (!result.success) {
      throw new AppError(result.error || 'Error al enviar WhatsApp', 500);
    }

    res.json({ success: true, id: result.id });
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
