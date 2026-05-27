import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as whatsappService from '../services/whatsappService.js';

const router = Router();

router.use(requireAuth);

router.get('/status', async (req, res, next) => {
  try {
    const status = whatsappService.getStatus();
    res.json({ data: status });
  } catch (err) {
    next(err);
  }
});

router.post('/connect', async (req, res, next) => {
  try {
    const result = await whatsappService.startConnection();
    res.json({ data: result });
  } catch (err) {
    res.json({ data: { status: 'error', error: err.message } });
  }
});

export default router;
