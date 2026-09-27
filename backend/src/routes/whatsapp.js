import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as whatsappService from '../services/whatsappService.js';
import * as templateService from '../services/templateService.js';

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

router.get('/templates', async (req, res, next) => {
  try {
    const templates = await templateService.getTemplates();
    res.json({ data: templates, placeholders: templateService.PLACEHOLDERS });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/templates/:status',
  [
    body('body').trim().notEmpty().withMessage('El mensaje no puede estar vacío'),
    body('autoSend').optional().isBoolean().withMessage('autoSend debe ser booleano'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const template = await templateService.updateTemplate(req.params.status, req.body);
      res.json({ data: template });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/templates/preview',
  [body('status').trim().notEmpty().withMessage('El estado es requerido')],
  validate,
  async (req, res, next) => {
    try {
      const { status } = req.body;
      const body = typeof req.body.body === 'string' && req.body.body.trim() ? req.body.body : null;
      const template = body ? { body } : await templateService.getTemplate(status);
      const sample = templateService.getSampleOrder(status);
      res.json({ data: { rendered: templateService.renderTemplate(template.body, sample) } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
