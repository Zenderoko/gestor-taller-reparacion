import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';

export async function list(req, res, next) {
  try {
    const { clientId, type, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (clientId) where.clientId = clientId;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search } },
      ];
    }

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { id: true, name: true, phone: true } } },
      }),
      prisma.equipment.count({ where }),
    ]);

    res.json({ data: equipment, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const item = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: { client: true, orders: { include: { statusHistory: true } } },
    });
    if (!item) throw new AppError('Equipo no encontrado', 404);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { clientId, type, brand, model, serialNumber, password, accessories, condition, notes } = req.body;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new AppError('Cliente no encontrado', 404);

    const equipment = await prisma.equipment.create({
      data: { clientId, type, brand, model, serialNumber, password, accessories, condition, notes },
    });

    res.status(201).json({ data: equipment });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const equipment = await prisma.equipment.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: equipment });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await prisma.equipment.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
