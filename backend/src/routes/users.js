import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = Router();

router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, phone: true },
    });
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
