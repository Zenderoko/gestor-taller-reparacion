import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as orderCtrl from '../controllers/orderController.js';

const router = Router();

router.use(requireAuth);

router.get('/', orderCtrl.list);
router.get('/:id', orderCtrl.getById);

router.post(
  '/',
  [
    body('clientId').notEmpty().withMessage('El cliente es requerido'),
    body('equipmentId').notEmpty().withMessage('El equipo es requerido'),
    body('reportedIssue').trim().notEmpty().withMessage('Describa el problema reportado'),
  ],
  validate,
  orderCtrl.create
);

router.put('/:id/status', orderCtrl.updateStatus);
router.put('/:id', orderCtrl.update);

router.post(
  '/:id/payments',
  [body('amount').isFloat({ min: 0 }).withMessage('Monto inválido')],
  validate,
  orderCtrl.addPayment
);

router.post('/:id/whatsapp', orderCtrl.sendWhatsApp);
router.get('/:id/pdf', orderCtrl.downloadPdf);
router.put('/:id/archive', orderCtrl.archive);
router.put('/:id/unarchive', orderCtrl.unarchive);

export default router;
