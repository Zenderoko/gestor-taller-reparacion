import { Router } from 'express';

const router = Router();

router.post('/clerk', (req, res) => {
  res.json({ success: true, message: 'Clerk no está configurado. Usa autenticación local.' });
});

export default router;
