import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { createAuditLog } from '../utils/audit.js';

export async function list(req, res, next) {
  try {
    const { search, showArchived, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (showArchived !== 'true') where.archived = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { documentId: { contains: search } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { orders: true, equipments: true } } },
      }),
      prisma.client.count({ where }),
    ]);

    res.json({ data: clients, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        equipments: { orderBy: { createdAt: 'desc' } },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { equipment: true, statusHistory: { take: 1, orderBy: { createdAt: 'desc' } } },
        },
      },
    });
    if (!client) throw new AppError('Cliente no encontrado', 404);
    res.json({ data: client });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, email, phone, documentId, address, notes } = req.body;

    if (documentId) {
      const existing = await prisma.client.findUnique({ where: { documentId } });
      if (existing) {
        throw new AppError('Ya existe un cliente con ese documento (RUT)', 409);
      }
    }

    const client = await prisma.client.create({
      data: { name, email, phone, documentId, address, notes, createdBy: req.auth.userId },
    });

    await createAuditLog({ action: 'CREATE', entity: 'Client', entityId: client.id, userId: req.auth.userId });

    res.status(201).json({ data: client });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { documentId } = req.body;

    if (documentId) {
      const existing = await prisma.client.findUnique({ where: { documentId } });
      if (existing && existing.id !== req.params.id) {
        throw new AppError('Ya existe otro cliente con ese documento (RUT)', 409);
      }
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: client });
  } catch (err) {
    next(err);
  }
}

export async function archive(req, res, next) {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { archived: true, archivedAt: new Date() },
    });
    await createAuditLog({ action: 'ARCHIVE', entity: 'Client', entityId: client.id, userId: req.auth.userId });
    res.json({ data: client });
  } catch (err) {
    next(err);
  }
}

export async function unarchive(req, res, next) {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { archived: false, archivedAt: null },
    });
    await createAuditLog({ action: 'UNARCHIVE', entity: 'Client', entityId: client.id, userId: req.auth.userId });
    res.json({ data: client });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const { id } = req.params;
    const orders = await prisma.repairOrder.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        equipment: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
        payments: true,
      },
    });
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
}
