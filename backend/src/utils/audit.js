import { prisma } from '../index.js';

export async function createAuditLog({ action, entity, entityId, userId, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch {
    // Silent fail - audit never blocks the main flow
  }
}
