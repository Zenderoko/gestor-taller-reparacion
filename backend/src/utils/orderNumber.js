import { prisma } from '../index.js';

export async function generateOrderNumber() {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  const lastOrder = await prisma.repairOrder.findFirst({
    where: { orderNumber: { startsWith: `OR${year}${month}` } },
    orderBy: { orderNumber: 'desc' },
  });

  let seq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.slice(-4), 10);
    seq = lastSeq + 1;
  }

  return `OR${year}${month}${String(seq).padStart(4, '0')}`;
}
