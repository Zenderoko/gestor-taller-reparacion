import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as clientCtrl from '../controllers/clientController.js';

const router = Router();

router.use(requireAuth);

router.get('/', clientCtrl.list);
router.get('/:id', clientCtrl.getById);
router.get('/:id/history', clientCtrl.getHistory);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('phone').trim().notEmpty().withMessage('El teléfono es requerido'),
    body('email').optional().isEmail().withMessage('Email inválido'),
  ],
  validate,
  clientCtrl.create
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().withMessage('Email inválido'),
  ],
  validate,
  clientCtrl.update
);

router.put('/:id/archive', clientCtrl.archive);
router.put('/:id/unarchive', clientCtrl.unarchive);
router.delete('/:id', clientCtrl.remove);

export default router;
