import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as dashboardCtrl from '../controllers/dashboardController.js';

const router = Router();

router.use(requireAuth);

router.get('/stats', dashboardCtrl.getStats);

export default router;
