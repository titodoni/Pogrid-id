import 'dotenv/config';

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_DEPARTMENTS } from '../lib/constants';

const prisma = new PrismaClient();

async function main() {
  await prisma.systemConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      clientName: process.env.COMPANY_NAME || 'POgrid Client',
      adminWaNumber: process.env.ADMIN_WA_NUMBER,
    },
  });

  await prisma.poSequence.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', year: new Date().getFullYear(), sequence: 0 },
  });

  for (const [index, name] of DEFAULT_DEPARTMENTS.entries()) {
    await prisma.department.upsert({
      where: { name },
      update: { order: index + 1, active: true },
      create: { name, order: index + 1 },
    });
  }

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Admin',
      role: 'ADMIN',
      pin: await bcrypt.hash('2468', 10),
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
