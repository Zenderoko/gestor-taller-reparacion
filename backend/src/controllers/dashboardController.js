import { prisma } from '../index.js';

export async function getStats(req, res, next) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      activeOrders,
      ordersThisMonth,
      totalClients,
      totalEquipment,
      pendingOrders,
      revenue,
      totalCostAgg,
      recentOrders,
      statusDistribution,
      upcomingDeliveries,
    ] = await Promise.all([
      prisma.repairOrder.count(),
      prisma.repairOrder.count({
        where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      }),
      prisma.repairOrder.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.client.count(),
      prisma.equipment.count(),
      prisma.repairOrder.count({
        where: { status: 'PENDING' },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.repairOrder.aggregate({
        _sum: { totalCost: true },
        where: {
          NOT: { status: 'CANCELLED', deposit: 0 },
        },
      }),
      prisma.repairOrder.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true, phone: true } },
          equipment: { select: { type: true, brand: true, model: true } },
        },
      }),
      prisma.repairOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.repairOrder.findMany({
        where: { status: 'READY_FOR_PICKUP' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { client: { select: { name: true, phone: true } } },
      }),
    ]);

    res.json({
      data: {
        overview: {
          totalOrders,
          activeOrders,
          ordersThisMonth,
          totalClients,
          totalEquipment,
          pendingOrders,
          revenueThisMonth: revenue._sum.amount || 0,
          totalCost: totalCostAgg._sum.totalCost || 0,
        },
        recentOrders,
        statusDistribution: statusDistribution.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        upcomingDeliveries,
      },
    });
  } catch (err) {
    next(err);
  }
}
