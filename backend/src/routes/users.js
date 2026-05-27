import { Router } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../index.js';
import { logger } from '../config/logger.js';

const router = Router();

router.use(requireAuth);

async function syncUserFromClerk(clerkId) {
  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email;

    const user = await prisma.user.upsert({
      where: { clerkId },
      update: { email, name, avatarUrl: clerkUser.imageUrl },
      create: {
        clerkId,
        email,
        name,
        role: clerkUser.publicMetadata?.role || 'RECEPTIONIST',
        avatarUrl: clerkUser.imageUrl,
      },
    });
    logger.info('Usuario sincronizado desde Clerk API', { clerkId });
    return user;
  } catch (err) {
    logger.error('Error syncing user from Clerk', { clerkId, error: err.message });
    return null;
  }
}

router.get('/me', async (req, res, next) => {
  try {
    let user = await prisma.user.findUnique({
      where: { clerkId: req.auth.userId },
      select: { id: true, clerkId: true, email: true, name: true, role: true, avatarUrl: true, phone: true },
    });

    if (!user) {
      user = await syncUserFromClerk(req.auth.userId);
    }

    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

export default router;
