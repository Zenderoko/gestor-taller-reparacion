import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as equipmentCtrl from '../controllers/equipmentController.js';

const router = Router();

router.use(requireAuth);

router.get('/', equipmentCtrl.list);
router.get('/:id', equipmentCtrl.getById);

router.post(
  '/',
  [
    body('clientId').notEmpty().withMessage('El cliente es requerido'),
    body('type').notEmpty().withMessage('El tipo es requerido'),
    body('brand').trim().notEmpty().withMessage('La marca es requerida'),
    body('model').trim().notEmpty().withMessage('El modelo es requerido'),
  ],
  validate,
  equipmentCtrl.create
);

router.put('/:id', equipmentCtrl.update);
router.put('/:id/archive', equipmentCtrl.archive);
router.put('/:id/unarchive', equipmentCtrl.unarchive);
router.delete('/:id', equipmentCtrl.remove);

export default router;
