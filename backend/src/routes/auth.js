import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as authCtrl from '../controllers/authController.js';

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validate,
  authCtrl.login
);

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
  ],
  validate,
  authCtrl.register
);

router.get('/me', requireAuth, authCtrl.getMe);
router.get('/users', requireAuth, authCtrl.listUsers);

export default router;
