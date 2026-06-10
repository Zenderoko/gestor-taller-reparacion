import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log('Ya existen usuarios en la base de datos. Seed omitido.');
    return;
  }

  const email = process.env.SEED_EMAIL || 'admin@gestortaller.cl';
  const name = process.env.SEED_NAME || 'Admin';
  const password = process.env.SEED_PASSWORD || 'admin123';

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, name, password: hashed, role: 'ADMIN', isActive: true },
  });

  console.log(`Usuario admin creado: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
