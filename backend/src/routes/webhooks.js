import { Router } from 'express';
import { Webhook } from 'svix';
import { prisma } from '../index.js';
import { logger } from '../config/logger.js';

const router = Router();

function svixHeaders(req) {
  return {
    'svix-id': req.headers['svix-id'],
    'svix-timestamp': req.headers['svix-timestamp'],
    'svix-signature': req.headers['svix-signature'],
  };
}

router.post('/clerk', async (req, res) => {
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const payload = wh.verify(req.body, svixHeaders(req));
    const { type, data } = payload;

    switch (type) {
      case 'user.created': {
        const email = data.email_addresses?.[0]?.email_address || '';
        const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || email;
        await prisma.user.upsert({
          where: { clerkId: data.id },
          update: { email, name },
          create: {
            clerkId: data.id,
            email,
            name,
            role: data.public_metadata?.role || 'RECEPTIONIST',
          },
        });
        logger.info('Usuario creado via webhook', { clerkId: data.id, email });
        break;
      }

      case 'user.updated': {
        const email = data.email_addresses?.[0]?.email_address;
        const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        const updateData = {};
        if (email !== undefined) updateData.email = email;
        if (name) updateData.name = name;
        if (data.public_metadata?.role) updateData.role = data.public_metadata.role;
        if (data.image_url) updateData.avatarUrl = data.image_url;
        if (data.phone_numbers?.[0]?.phone_number) updateData.phone = data.phone_numbers[0].phone_number;

        await prisma.user.update({
          where: { clerkId: data.id },
          data: updateData,
        });
        logger.info('Usuario actualizado via webhook', { clerkId: data.id });
        break;
      }

      case 'user.deleted':
        await prisma.user.update({
          where: { clerkId: data.id },
          data: { isActive: false },
        });
        logger.info('Usuario desactivado via webhook', { clerkId: data.id });
        break;
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('Webhook error', { error: err.message });
    res.status(400).json({ error: 'Webhook inválido' });
  }
});

export default router;
